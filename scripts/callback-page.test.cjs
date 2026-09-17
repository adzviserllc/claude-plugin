'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');
const { installCallbackPage } = require('../runtime/callback-page.cjs');

installCallbackPage();
const originalSuccess = 'Authorization successful! You may close this window and return to the CLI.';
const rawError = 'Authorization failed: <script>location="https://untrusted.invalid"</script>';
const server = http.createServer((req, res) => {
  const failure = req.url.includes('error=');
  const body = failure ? rawError : originalSuccess;
  res.statusCode = failure ? 400 : 200;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.setHeader('ETag', 'upstream-body');
  res.end(body);
});
const ready = (async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
})();
after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));

test('replaces only callback presentation, with private response headers and clean URLs', async () => {
  const response = await fetch(`${await ready}/oauth/callback?code=test-secret&state=test-state`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Back to your insights\./);
  assert.match(html, /Return to your conversation/);
  assert.match(html, /history.replaceState\(null, '', location.pathname\)/);
  assert.doesNotMatch(html, /test-secret|test-state|return to the CLI/);
  assert.equal(Number(response.headers.get('content-length')), Buffer.byteLength(html));
  assert.equal(response.headers.get('etag'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  const csp = response.headers.get('content-security-policy');
  const nonce = csp.match(/script-src 'nonce-([^']+)'/)[1];
  assert.ok(html.includes(`<script nonce="${nonce}">`));
  assert.ok(html.includes(`<style nonce="${nonce}">`));
  assert.ok(csp.includes("default-src 'none'"));
});

test('authorization failure keeps its failure status and never renders provider-supplied HTML', async () => {
  const response = await fetch(`${await ready}/oauth/callback?error=access_denied`);
  const html = await response.text();
  assert.equal(response.status, 400);
  assert.match(html, /Sign-in wasn’t completed/);
  assert.doesNotMatch(html, /untrusted.invalid|Back to your insights/);
});

test('other routes and non-GET requests are unchanged', async () => {
  for (const [route, method] of [['/wait-for-auth', 'GET'], ['/oauth/callback', 'POST']]) {
    const response = await fetch(`${await ready}${route}`, { method });
    assert.equal(await response.text(), originalSuccess);
    assert.equal(response.headers.get('etag'), 'upstream-body');
  }
});
