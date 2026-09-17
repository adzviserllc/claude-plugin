'use strict';

// Test client only. Claude owns remote OAuth in the shipped plugin.
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { findPackage } = require('../runtime/connect.cjs');

async function main() {
  const config = JSON.parse(readFileSync(0, 'utf8'));
  const endpoint = new URL(config.url);
  assert.equal(config.type, 'http');
  assert.equal(endpoint.hostname, '127.0.0.1', 'Only loopback fixtures are permitted');
  const sdk = findPackage('@modelcontextprotocol/sdk', '1.30.0');
  const moduleAt = file => import(pathToFileURL(path.join(sdk, 'dist/esm/client', file)).href);
  const { Client } = await moduleAt('index.js');
  const { StreamableHTTPClientTransport } = await moduleAt('streamableHttp.js');
  const { UnauthorizedError } = await moduleAt('auth.js');
  const state = randomBytes(24).toString('hex');
  let clientInformation, tokens, verifier, authorizationUrl;
  let redirects = 0;
  const provider = {
    redirectUrl: 'http://127.0.0.1:1/synthetic-callback',
    clientMetadata: {
      client_name: 'Adzviser synthetic remote test',
      redirect_uris: ['http://127.0.0.1:1/synthetic-callback'],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'], token_endpoint_auth_method: 'none',
    },
    state: () => state,
    clientInformation: () => clientInformation,
    saveClientInformation: value => { clientInformation = value; },
    tokens: () => tokens,
    saveTokens: value => { tokens = value; },
    saveCodeVerifier: value => { verifier = value; },
    codeVerifier: () => verifier,
    redirectToAuthorization: value => { authorizationUrl = value; redirects += 1; },
  };

  const pending = new Client({ name: 'adzviser-remote-test', version: '1.0' });
  const transport = new StreamableHTTPClientTransport(endpoint, { authProvider: provider });
  try {
    await assert.rejects(pending.connect(transport), UnauthorizedError);
    assert.equal(authorizationUrl.origin, endpoint.origin);
    assert.equal(authorizationUrl.searchParams.get('code_challenge_method'), 'S256');
    assert.equal(authorizationUrl.searchParams.get('state'), state);
    assert.equal(tokens, undefined, 'Missing authorization must not expose data');
    const authorized = await fetch(authorizationUrl, { redirect: 'manual' });
    assert.equal(authorized.status, 302);
    const callback = new URL(authorized.headers.get('location'));
    assert.equal(callback.origin + callback.pathname, provider.redirectUrl);
    assert.equal(callback.searchParams.get('state'), state);
    await transport.finishAuth(callback.searchParams.get('code'));
  } finally {
    await pending.close();
  }

  for (const label of ['initial', 'resumed', 'refreshed']) {
    if (label === 'refreshed') tokens = { ...tokens, access_token: 'synthetic-expired' };
    const client = new Client({ name: 'adzviser-remote-test', version: '1.0' });
    try {
      await client.connect(new StreamableHTTPClientTransport(endpoint, { authProvider: provider }));
      const { tools } = await client.listTools();
      assert.ok(tools.some(tool => tool.name === 'list_workspace'));
      const result = await client.callTool({ name: 'list_workspace', arguments: {} });
      assert.ok(!result.isError);
      assert.deepEqual(JSON.parse(result.content[0].text), [{ name: 'Fixture workspace', sources: ['Google Ads'] }]);
      assert.equal(redirects, 1, 'Saved remote authorization must not prompt again');
      console.log(`${label}: remote workspace call passed`);
    } finally {
      await client.close();
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
