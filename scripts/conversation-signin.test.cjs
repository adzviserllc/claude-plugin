'use strict';
const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile, readdir, stat, rm, mkdir, utimes } = require('node:fs/promises');
const { randomBytes, createHash } = require('node:crypto');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createRequire } = require('node:module');
const { findPackage } = require('../runtime/connect.cjs');
const digest = value => createHash('sha256').update(value).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const sdkRoot = findPackage('@modelcontextprotocol/sdk', '1.30.0');
  const sdk = file => import(pathToFileURL(path.join(sdkRoot, 'dist/esm', file)).href);
  const express = createRequire(path.join(sdkRoot, 'package.json'))('express');
  const { Client } = await sdk('client/index.js');
  const { StdioClientTransport } = await sdk('client/stdio.js');
  const { ToolListChangedNotificationSchema } = await sdk('types.js');
  const app = express();
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const state = { registrations: 0, logins: 0, refreshes: 0, calls: 0, creates: 0, deny: false, breakPoll: false, revoked: false };
  const clients = new Map(), codes = new Map(), mailboxes = new Map();
  const allSecrets = [];
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.get('/.well-known/oauth-protected-resource', (_req, res) => res.json({ resource: origin + '/mcp', authorization_servers: [origin] }));
  app.get('/.well-known/oauth-authorization-server', (_req, res) => res.json({ issuer: origin,
    authorization_endpoint: origin + '/authorize', token_endpoint: origin + '/token', registration_endpoint: origin + '/register',
    response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'] }));
  app.post('/register', (req, res) => {
    state.registrations++;
    const client_id = randomBytes(12).toString('hex'); const info = { ...req.body, client_id };
    clients.set(client_id, info); res.status(201).json(info);
  });
  app.get('/authorize', (req, res) => {
    state.logins++;
    assert.equal(req.query.redirect_uri, origin + '/plugin-auth/callback');
    assert.equal(req.query.code_challenge_method, 'S256');
    const code = randomBytes(32).toString('hex');
    codes.set(code, { clientId: req.query.client_id, challenge: req.query.code_challenge }); allSecrets.push(code);
    const next = new URL(req.query.redirect_uri);
    next.searchParams.set('state', req.query.state);
    if (state.deny) next.searchParams.set('error', 'access_denied'); else next.searchParams.set('code', code);
    res.redirect(next.href);
  });
  app.post('/token', (req, res) => {
    if (req.body.grant_type === 'refresh_token' && state.revoked) return res.status(400).json({ error: 'invalid_grant' });
    if (req.body.grant_type === 'authorization_code') {
      const code = codes.get(req.body.code);
      const challenge = createHash('sha256').update(req.body.code_verifier).digest('base64url');
      if (!code || code.challenge !== challenge || code.clientId !== req.body.client_id) return res.status(400).json({ error: 'invalid_grant' });
      assert.equal(req.body.redirect_uri, origin + '/plugin-auth/callback');
      allSecrets.push(req.body.code_verifier); codes.delete(req.body.code); state.revoked = false;
    } else if (req.body.grant_type === 'refresh_token' && req.body.refresh_token === 'fixture-refresh') state.refreshes++;
    else return res.status(400).json({ error: 'invalid_grant' });
    res.json({ access_token: 'fixture-access', refresh_token: 'fixture-refresh', token_type: 'Bearer', expires_in: 3600 });
  });
  app.post('/mcp', (req, res) => {
    if (state.revoked || req.headers.authorization !== 'Bearer fixture-access') return res.status(401)
      .set('WWW-Authenticate', `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`).json({ error: 'unauthorized' });
    const r = req.body;
    if (r.id === undefined) return res.sendStatus(202);
    let result;
    if (r.method === 'initialize') result = { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: '1' } };
    else if (r.method === 'tools/list') result = { tools: [{ name: 'list_workspace', inputSchema: { type: 'object' } }] };
    else if (r.method === 'tools/call') { state.calls++; result = { content: [{ type: 'text', text: 'Fixture workspace' }] }; }
    else result = {};
    res.json({ jsonrpc: '2.0', id: r.id, result });
  });
  app.get('/mcp', (_req, res) => res.sendStatus(405));
  app.use('/plugin-auth', (req, res, next) => {
    if (req.path === '/poll') {
      allSecrets.push((req.headers.authorization || '').replace(/^Bearer /, ''));
      if (state.breakPoll) return res.sendStatus(410);
    }
    if (req.path === '/requests') state.creates++;
    next();
  });
  if (process.env.CONVERSATION_SIGNIN_ROUTER) {
    // Optional cross-repository integration: run the actual deployed router's
    // implementation against synthetic OAuth, without Redis or customer data.
    const { conversationSignInRouter } = await import(pathToFileURL(process.env.CONVERSATION_SIGNIN_ROUTER).href);
    const values = new Map();
    app.use('/plugin-auth', conversationSignInRouter({ origin,
      store: {
        incrementWithExpiry: async (prefix, key, ttl) => { const k = prefix + key, old = values.get(k);
          const n = old && old.until > Date.now() ? Number(old.text) + 1 : 1;
          values.set(k, { text: String(n), until: n === 1 ? Date.now() + ttl * 1000 : old.until }); return n; },
        get: async (prefix, key) => { const v = values.get(prefix + key); return v && v.until > Date.now() ? JSON.parse(v.text) : undefined; },
        setNX: async (prefix, key, text, ttl) => { const k = prefix + key; if (values.get(k)?.until > Date.now()) return false;
          values.set(k, { text, until: Date.now() + ttl * 1000 }); return true; },
      }, getClient: async id => clients.get(id), codeBinding: async code => codes.get(code),
    }));
  } else {
    // Protocol fixture for the standalone plugin CI. Security checks for the
    // production relay are tested in the MCP service repository.
    app.post('/plugin-auth/requests', (req, res) => { mailboxes.set(req.body.state, { ...req.body, status: 'pending' }); res.status(201).json({ expires_in: 300, interval: 2 }); });
    app.post('/plugin-auth/poll', (req, res) => {
      const pending = mailboxes.get(req.body.state);
      if (!pending || digest(req.headers.authorization.replace(/^Bearer /, '')) !== pending.poll_token_hash) return res.sendStatus(404);
      res.json({ status: pending.status, code: pending.code });
    });
    app.get('/plugin-auth/callback', (req, res) => {
      const pending = mailboxes.get(req.query.state);
      if (!pending) return res.sendStatus(400);
      pending.code = req.query.code; pending.status = req.query.error ? 'denied' : 'authorized';
      res.redirect(303, '/plugin-auth/done');
    });
    app.get('/plugin-auth/done', (_req, res) => res.send('Sign-in received. Return to your conversation.'));
  }
  const temp = await mkdtemp(path.join(tmpdir(), 'adzviser-conversation-test-'));
  const active = new Set(), visible = [], logs = [];
  async function bridge(directory = temp, timeout = '300') {
    const client = new Client({ name: 'test-host', version: '1' });
    let changed = 0;
    client.setNotificationHandler(ToolListChangedNotificationSchema, () => { changed++; });
    const transport = new StdioClientTransport({ command: process.execPath,
      args: [path.resolve(__dirname, '../runtime/connect.cjs'), origin + '/mcp', '--auth-timeout', timeout],
      env: { PATH: process.env.PATH, MCP_REMOTE_CONFIG_DIR: directory }, stderr: 'pipe' });
    transport.stderr.on('data', value => logs.push(value.toString()));
    await client.connect(transport); active.add(client);
    const call = async name => { const result = await client.callTool({ name, arguments: {} }); visible.push(JSON.stringify(result)); return result.structuredContent; };
    return { client, call, changes: () => changed, close: async () => { await client.close(); active.delete(client); } };
  }
  async function waitConnected(b) {
    for (let i = 0; i < 60; i++) { const result = await b.call('adzviser_connection_status'); if (result.state === 'connected') return; if (result.state === 'failed') throw Error('Connection failed'); await sleep(100); }
    throw Error('Connection did not finish');
  }
  try {
    let b = await bridge();
    await b.client.listTools(); assert.equal((await b.call('adzviser_connection_status')).state, 'idle');
    assert.equal(state.registrations, 0); assert.equal(state.creates, 0);
    const link = await b.call('adzviser_sign_in'); assert.equal(link.state, 'awaiting_sign_in');
    assert.equal((await b.call('adzviser_sign_in')).authorization_url, link.authorization_url); assert.equal(state.creates, 1);
    assert.ok(!(await b.client.listTools()).tools.some(t => t.name === 'list_workspace'));
    const page = await fetch(link.authorization_url); assert.equal(page.status, 200);
    assert.equal(new URL(page.url).pathname, '/plugin-auth/done'); assert.equal(new URL(page.url).search, '');
    assert.ok((await page.text()).includes('conversation'));
    await waitConnected(b); assert.ok(b.changes() > 0);
    assert.equal((await b.client.callTool({ name: 'list_workspace', arguments: {} })).content[0].text, 'Fixture workspace');
    await b.close();
    b = await bridge(); assert.equal((await b.call('adzviser_sign_in')).state, 'connected');
    await b.client.callTool({ name: 'list_workspace', arguments: {} }); await b.close();
    assert.equal(state.logins, 1); assert.equal(state.creates, 1);
    const file = path.join(temp, 'conversation', (await readdir(path.join(temp, 'conversation'))).find(f => f.endsWith('.json')));
    assert.equal((await stat(file)).mode & 0o777, 0o600); assert.equal((await stat(path.dirname(file))).mode & 0o777, 0o700);
    const cached = JSON.parse(await readFile(file, 'utf8')); cached.tokens.access_token = 'expired'; await writeFile(file, JSON.stringify(cached));
    // A crashed helper leaves a lease directory. A stale lease must be reclaimed.
    await mkdir(file + '.lock');
    const old = new Date(Date.now() - 20_000); await utimes(file + '.lock', old, old);
    const a = await bridge(), c = await bridge();
    await Promise.all([a.call('adzviser_sign_in'), c.call('adzviser_sign_in')]);
    await Promise.all([waitConnected(a), waitConnected(c)]);
    assert.equal(state.refreshes, 1); assert.equal(state.logins, 1);
    await c.close();
    state.revoked = true;
    await assert.rejects(a.client.callTool({ name: 'list_workspace', arguments: {} }));
    assert.equal((await a.call('adzviser_connection_status')).state, 'failed');
    assert.equal(state.creates, 1, 'revocation must not open an unmonitored sign-in');
    const newLink = await a.call('adzviser_sign_in');
    assert.equal(newLink.state, 'awaiting_sign_in');
    assert.notEqual(newLink.authorization_url, link.authorization_url);
    await fetch(newLink.authorization_url); await waitConnected(a); await a.close();
    console.log('PASS: conversation link, hosted callback, PKCE, same-session tools, private cache, restart reuse, concurrent refresh, crash recovery and revoked-login retry');
    state.deny = true; b = await bridge(path.join(temp, 'denied'));
    const denied = await b.call('adzviser_sign_in'); await fetch(denied.authorization_url); await sleep(2300);
    assert.equal((await b.call('adzviser_connection_status')).state, 'failed');
    assert.ok(!(await b.client.listTools()).tools.some(t => t.name === 'list_workspace'));
    state.deny = false;
    const retry = await b.call('adzviser_sign_in');
    assert.equal(retry.state, 'awaiting_sign_in');
    assert.notEqual(retry.authorization_url, denied.authorization_url);
    await fetch(retry.authorization_url); await waitConnected(b); await b.close();
    b = await bridge(path.join(temp, 'expired'), '1'); await b.call('adzviser_sign_in'); await sleep(1300);
    assert.equal((await b.call('adzviser_connection_status')).state, 'failed'); await b.close();
    b = await bridge(path.join(temp, 'cancelled')); await b.call('adzviser_sign_in'); await b.close();
    const cancelFiles = await readdir(path.join(temp, 'cancelled', 'conversation'));
    assert.ok(!cancelFiles.some(f => f.endsWith('.lock')), 'shutdown releases cache lock');
    const output = visible.join('\n') + logs.join('\n');
    for (const value of [...allSecrets, 'fixture-access', 'fixture-refresh'].filter(Boolean)) assert.ok(!output.includes(value), 'Credentials must not enter tool results or logs');
    console.log('PASS: denial, expiry, cancellation, no secret leakage, no browser launch or localhost listener');
  } finally {
    await Promise.all([...active].map(client => client.close()));
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    await rm(temp, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
