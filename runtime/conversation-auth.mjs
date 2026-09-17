import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, lstat, chmod } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { findPackage } = require('./connect.cjs');
import { setTimeout as delay } from 'node:timers/promises';

const digest = value => createHash('sha256').update(value).digest('hex');
const cacheFile = (endpoint, directory) => path.join(directory, 'conversation', `${digest(new URL(endpoint).href)}.json`);
async function readCache(filename) {
  try {
    const parent = await lstat(path.dirname(filename));
    const info = await lstat(filename);
    if (!parent.isDirectory() || parent.isSymbolicLink() || info.isSymbolicLink() || !info.isFile()) throw new Error('Invalid auth file');
    return JSON.parse(await readFile(filename, 'utf8'));
  } catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
}
// Inspect only this helper's private cache. A status check may resume a sign-in
// the user already started, but must never initiate a new authorization flow.
export async function hasSavedConversationAuth({ endpoint, directory }) {
  if (!directory) return false;
  const saved = await readCache(cacheFile(endpoint, directory));
  return Boolean(saved.pending || saved.tokens?.access_token);
}

// The model sees only the authorization URL. Poll secrets, PKCE verifiers,
// authorization codes, and tokens stay between this helper and Adzviser.
export async function createConversationAuth({ endpoint, directory, signal, onLink, onNeedsSignIn, sdk, fetchFn = fetch }) {
  const url = new URL(endpoint);
  if (url.href !== 'https://mcp.adzviser.com/http' &&
      !(url.protocol === 'http:' && url.hostname === '127.0.0.1')) {
    throw new Error('Unsupported conversation sign-in endpoint');
  }
  if (!directory) throw new Error('Plugin data directory is unavailable');
  const cache = path.join(directory, 'conversation');
  await mkdir(cache, { recursive: true, mode: 0o700 });
  if (!(await lstat(cache)).isDirectory() || (await lstat(cache)).isSymbolicLink()) throw new Error('Invalid auth directory');
  await chmod(cache, 0o700);
  const filename = cacheFile(endpoint, directory);
  const lockfile = require(findPackage('proper-lockfile', '4.1.2'));
  let compromised = false;
  let stored = {};
  let verifier;
  let currentState;
  let authorizing = false;
  const redirectUrl = new URL('/plugin-auth/callback', url).href;
  const api = async (route, body, secret) => {
    const response = await fetchFn(new URL('/plugin-auth/' + route, url), {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(secret ? { Authorization: `Bearer ${secret}` } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]), redirect: 'error',
    });
    if (!response.ok) {
      const error = new Error('Conversation sign-in unavailable');
      error.expiredMailbox = route === 'poll' && [404, 410].includes(response.status);
      throw error;
    }
    return response.json();
  };
  async function load() {
    stored = await readCache(filename);
    try { await chmod(filename, 0o600); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  async function save() {
    signal.throwIfAborted();
    if (compromised) throw new Error('Connection storage lock was lost');
    const temporary = filename + '.' + randomBytes(12).toString('hex');
    try {
      await writeFile(temporary, JSON.stringify(stored), { flag: 'wx', mode: 0o600 });
      await rename(temporary, filename);
    } finally { await rm(temporary, { force: true }); }
  }
  // Serialize each network operation, but release the lease between polls.
  // A host may stop this process as soon as a tool response is delivered.
  async function exclusive(action) {
    const until = Date.now() + 310_000;
    let release;
    while (true) {
      signal.throwIfAborted();
      if (compromised) throw new Error('Connection storage lock was lost');
      try {
        release = await lockfile.lock(filename, { realpath: false, stale: 10_000, update: 2000,
          onCompromised: () => { compromised = true; } });
        break;
      }
      catch (error) {
        if (error.code !== 'ELOCKED') throw error;
        if (Date.now() > until) throw new Error('Another session is using this connection');
        await delay(150, undefined, { signal });
      }
    }
    try { await load(); return await action(); }
    finally { await release(); }
  }
  const provider = {
    redirectUrl,
    clientMetadata: { client_name: 'Adzviser conversation sign-in', redirect_uris: [redirectUrl],
      grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'], token_endpoint_auth_method: 'none' },
    state: () => currentState ||= randomBytes(32).toString('base64url'),
    clientInformation: () => stored.client,
    saveClientInformation: async value => { stored.client = value; await save(); },
    tokens: () => stored.tokens,
    saveTokens: async value => { stored.tokens = value; delete stored.pending; await save(); },
    saveCodeVerifier: value => { verifier = value; },
    codeVerifier: () => { if (!verifier) throw new Error('No pending sign-in'); return verifier; },
    invalidateCredentials: async scope => {
      if (scope === 'all' || scope === 'client') delete stored.client;
      if (scope === 'all' || scope === 'tokens') delete stored.tokens;
      if (scope === 'all' || scope === 'verifier') verifier = undefined;
      if (scope === 'all' || scope === 'client' || scope === 'verifier') delete stored.pending;
      await save();
    },
    redirectToAuthorization: async value => {
      if (!authorizing) {
        await onNeedsSignIn?.();
        throw new Error('Sign-in is required again');
      }
      // This helper serves one known provider, not arbitrary discovered URLs.
      const target = new URL(value);
      if (target.origin !== url.origin || target.pathname !== '/authorize' ||
          target.searchParams.get('redirect_uri') !== redirectUrl ||
          target.searchParams.get('state') !== currentState ||
          target.searchParams.get('code_challenge_method') !== 'S256') throw new Error('Invalid authorization destination');
      const secret = randomBytes(32).toString('base64url');
      const result = await api('requests', {
        state: currentState, client_id: target.searchParams.get('client_id'),
        code_challenge: target.searchParams.get('code_challenge'), poll_token_hash: digest(secret),
      });
      if (!Number.isFinite(result.expires_in) || result.expires_in <= 0) throw new Error('Invalid sign-in lifetime');
      stored.pending = { secret, state: currentState, verifier, authorization: target.href,
        until: Date.now() + Math.min(300, result.expires_in) * 1000 };
      // Persist before exposing the link. Both the verifier and poll secret are
      // private credentials, protected exactly like saved tokens and removed
      // when the attempt completes, is denied, or expires.
      await save();
      showPending();
    },
  };
  const { StreamableHTTPClientTransport } = await sdk('client/streamableHttp.js');
  const { UnauthorizedError } = await sdk('client/auth.js');
  let transport;
  function makeTransport() {
    return new StreamableHTTPClientTransport(url, { authProvider: provider,
      fetch: (input, init) => fetchFn(input, { ...init, signal: AbortSignal.any([signal, AbortSignal.timeout(20_000), ...(init?.signal ? [init.signal] : [])]) }) });
  }
  function showPending() {
    const pending = stored.pending;
    onLink({ authorization_url: pending.authorization, expires_in: Math.max(0, Math.ceil((pending.until - Date.now()) / 1000)) });
  }
  async function restorePending() {
    const pending = stored.pending;
    if (!pending) return false;
    let valid = false;
    try {
      const target = new URL(pending.authorization);
      valid = /^[A-Za-z0-9_-]{43}$/.test(pending.state) && /^[A-Za-z0-9_-]{43}$/.test(pending.secret) &&
        /^[A-Za-z0-9._~-]{43,128}$/.test(pending.verifier) && Number.isFinite(pending.until) &&
        pending.until > Date.now() && pending.until <= Date.now() + 300_000 &&
        target.origin === url.origin && target.pathname === '/authorize' &&
        target.searchParams.get('redirect_uri') === redirectUrl &&
        target.searchParams.get('client_id') === stored.client?.client_id &&
        target.searchParams.get('state') === pending.state && target.searchParams.get('code_challenge_method') === 'S256' &&
        target.searchParams.get('code_challenge') === createHash('sha256').update(pending.verifier).digest('base64url');
    } catch {}
    if (!valid) { delete stored.pending; await save(); return false; }
    verifier = pending.verifier; currentState = pending.state;
    return true;
  }
  async function connect(client, { allowNewSignIn = true } = {}) {
    authorizing = allowNewSignIn;
    try {
      const waiting = await exclusive(async () => {
        if (await restorePending()) return true;
        if (!allowNewSignIn && !stored.tokens?.access_token) throw new Error('No saved sign-in to resume');
        transport = makeTransport();
        try { await client.connect(transport); return false; }
        catch (error) { if (!(error instanceof UnauthorizedError) || !stored.pending) throw error; }
        return true;
      });
      if (!waiting) return;
      while (true) {
        const pending = await exclusive(async () => {
          // Another helper may have completed this same attempt while our
          // lease was released. Reuse its tokens instead of exchanging twice.
          if (!stored.pending && stored.tokens?.access_token) {
            authorizing = false;
            await transport?.close(); transport = makeTransport(); await client.connect(transport); return false;
          }
          if (!await restorePending()) throw new Error('Sign-in expired');
          let result;
          try { result = await api('poll', { state: stored.pending.state }, stored.pending.secret); }
          catch (error) {
            if (error.expiredMailbox) { delete stored.pending; await save(); }
            throw error;
          }
          if (result.status === 'pending') { showPending(); return true; }
          if (result.status !== 'authorized' || typeof result.code !== 'string') {
            delete stored.pending; await save(); throw new Error('Sign-in was not completed');
          }
          transport ||= makeTransport();
          await transport.finishAuth(result.code);
          await transport.close(); transport = makeTransport();
          // Don't silently launch a second flow if newly obtained tokens fail.
          authorizing = false;
          await client.connect(transport);
          verifier = undefined;
          return false;
        });
        if (!pending) return;
        await delay(2000, undefined, { signal });
      }
    } finally { authorizing = false; currentState = undefined; }
  }
  return { connect, exclusive, close: async () => { verifier = undefined; await transport?.close(); } };
}
