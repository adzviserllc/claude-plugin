import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, rm, lstat, chmod } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { findPackage } = require('./connect.cjs');
import { setTimeout as delay } from 'node:timers/promises';

const digest = value => createHash('sha256').update(value).digest('hex');

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
  const filename = path.join(cache, `${digest(url.href)}.json`);
  const lockfile = require(findPackage('proper-lockfile', '4.1.2'));
  let compromised = false;
  let stored = {};
  let verifier;
  let authorization;
  let mailbox;
  let currentState;
  let authorizing = false;
  const redirectUrl = new URL('/plugin-auth/callback', url).href;
  const api = async (route, body, secret) => {
    const response = await fetchFn(new URL('/plugin-auth/' + route, url), {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(secret ? { Authorization: `Bearer ${secret}` } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]), redirect: 'error',
    });
    if (!response.ok) throw new Error('Conversation sign-in unavailable');
    return response.json();
  };
  async function load() {
    try {
      const info = await lstat(filename);
      if (info.isSymbolicLink() || !info.isFile()) throw new Error('Invalid auth file');
      stored = JSON.parse(await readFile(filename, 'utf8'));
      await chmod(filename, 0o600);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      stored = {};
    }
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
  // Serialize initialization and data requests across helpers sharing this
  // cache so a refresh or first login cannot overwrite another session's login.
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
    saveTokens: async value => { stored.tokens = value; await save(); },
    saveCodeVerifier: value => { verifier = value; },
    codeVerifier: () => { if (!verifier) throw new Error('No pending sign-in'); return verifier; },
    invalidateCredentials: async scope => {
      if (scope === 'all' || scope === 'client') delete stored.client;
      if (scope === 'all' || scope === 'tokens') delete stored.tokens;
      if (scope === 'all' || scope === 'verifier') verifier = undefined;
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
      mailbox = { secret, state: currentState, until: Date.now() + Math.min(300, result.expires_in) * 1000 };
      authorization = target.href;
      onLink({ authorization_url: authorization, expires_in: Math.min(300, result.expires_in) });
    },
  };
  const { StreamableHTTPClientTransport } = await sdk('client/streamableHttp.js');
  const { UnauthorizedError } = await sdk('client/auth.js');
  let transport;
  async function connect(client) {
    authorizing = true;
    return exclusive(async () => {
      transport = new StreamableHTTPClientTransport(url, { authProvider: provider,
        fetch: (input, init) => fetchFn(input, { ...init, signal: AbortSignal.any([signal, AbortSignal.timeout(20_000), ...(init?.signal ? [init.signal] : [])]) }) });
      try { await client.connect(transport); return; }
      catch (error) { if (!(error instanceof UnauthorizedError) || !mailbox) throw error; }
      while (Date.now() < mailbox.until) {
        await delay(2000, undefined, { signal });
        const result = await api('poll', { state: mailbox.state }, mailbox.secret);
        if (result.status === 'pending') continue;
        if (result.status !== 'authorized' || typeof result.code !== 'string') throw new Error('Sign-in was not completed');
        await transport.finishAuth(result.code);
        await transport.close();
        transport = new StreamableHTTPClientTransport(url, { authProvider: provider,
          fetch: (input, init) => fetchFn(input, { ...init, signal: AbortSignal.any([signal, AbortSignal.timeout(20_000), ...(init?.signal ? [init.signal] : [])]) }) });
        await client.connect(transport);
        mailbox = undefined; verifier = undefined; authorization = undefined;
        return;
      }
      throw new Error('Sign-in expired');
    }).finally(() => { authorizing = false; currentState = undefined; });
  }
  return { connect, exclusive, close: async () => { mailbox = undefined; verifier = undefined; await transport?.close(); } };
}
