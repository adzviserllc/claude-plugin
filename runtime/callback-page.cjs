'use strict';

// Presentation only: mcp-remote still handles every OAuth request and response.
const http = require('node:http');
const { randomBytes } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const template = readFileSync(path.join(__dirname, 'callback.html'), 'utf8');
const logo = readFileSync(path.join(__dirname, '../assets/adzviser.png')).toString('base64');
const check = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m8 16 5.5 5.5L24 11"/></svg>';
const warning = '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="16" cy="16" r="11"/><path d="M16 10v7m0 5v.1"/></svg>';

function renderPage(success, nonce) {
  // Use fixed copy only. Never interpolate codes, state, tokens, or provider errors.
  const values = {
    NONCE: nonce,
    LOGO: logo,
    STATUS_ICON: success ? check : warning,
    EYEBROW: success ? 'Sign-in received' : 'Connection paused',
    TITLE: success ? 'Back to your insights.' : 'Let’s try that again.',
    DESCRIPTION: success
      ? 'You can close this tab and return to the conversation where you started sign-in.'
      : 'Sign-in wasn’t completed. Return to your conversation and reconnect Adzviser when you’re ready.',
    NEXT_STEP: success ? 'Continue your conversation with Adzviser.' : 'Reconnect Adzviser to start a new sign-in.',
  };
  return template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Unknown callback page field: ${key}`);
    return values[key];
  });
}

function installCallbackPage() {
  const createServer = http.createServer;
  http.createServer = function (...args) {
    const server = createServer.apply(this, args);
    server.prependListener('request', (request, response) => {
      // The pinned helper serves the callback on IPv4 loopback. Other routes,
      // streaming responses, and the remote MCP transport remain untouched.
      if (request.method !== 'GET' || request.socket.localAddress !== '127.0.0.1'
          || request.url.split('?', 1)[0] !== '/oauth/callback') return;
      const end = response.end;
      response.end = function (chunk, encoding, callback) {
        const body = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
        const success = this.statusCode === 200 && typeof body === 'string'
          && body.includes('Authorization successful!') && body.includes('return to the CLI.');
        const failure = this.statusCode === 400 && typeof body === 'string'
          && (body.startsWith('Authorization failed:') || body === 'Error: No authorization code received');
        if (!this.headersSent && (success || failure)) {
          const nonce = randomBytes(18).toString('base64');
          const html = renderPage(success, nonce);
          this.setHeader('Content-Type', 'text/html; charset=utf-8');
          this.setHeader('Content-Length', Buffer.byteLength(html));
          this.removeHeader('ETag');
          this.setHeader('Cache-Control', 'no-store');
          this.setHeader('Referrer-Policy', 'no-referrer');
          this.setHeader('X-Content-Type-Options', 'nosniff');
          this.setHeader('Content-Security-Policy', `default-src 'none'; img-src data:; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`);
          return end.call(this, html, 'utf8', typeof encoding === 'function' ? encoding : callback);
        }
        return end.call(this, chunk, encoding, callback);
      };
    });
    return server;
  };
}

module.exports = { installCallbackPage, renderPage };
