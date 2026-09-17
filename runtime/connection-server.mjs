import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';
import { createConversationAuth } from './conversation-auth.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(readFileSync(path.join(root, '../.claude-plugin/plugin.json'), 'utf8')).version;
const STATUS_TOOL = 'adzviser_connection_status';
const CONNECT_TOOL = 'adzviser_connect';
const SIGN_IN_TOOL = 'adzviser_sign_in';
const statusTool = {
  name: STATUS_TOOL,
  title: 'Adzviser connection status',
  description: 'Read this plugin helper’s connection status without starting sign-in. If idle and no working Adzviser data tools exist, use adzviser_sign_in for a conversation link in Cowork, or adzviser_connect for the existing local Code login. After the user returns, check once, discover data tools and continue their request. This is not the status of a separate Claude-managed connector. Do not poll repeatedly.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};
const connectTool = {
  name: CONNECT_TOOL,
  title: 'Connect Adzviser in local Claude Code',
  description: 'Start the local Adzviser connection when using Claude Code terminal or a local Desktop Code session. Reuses this helper’s saved login, or opens a browser for authorization. Do not call this for Cowork or remote access; use the remote Adzviser connection and its host-managed sign-in there. Calling again during connection or after success does not start another helper.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
};
const signInTool = {
  name: SIGN_IN_TOOL,
  title: 'Connect Adzviser',
  description: 'Connect Adzviser from this conversation when no working Adzviser data connection is available. Returns a browser sign-in link if needed and receives completion automatically through Adzviser, with no localhost callback or codes to paste. Reuses this helper’s saved conversation sign-in. Use in Cowork when this tool is available. Show authorization_url as a Connect Adzviser link, then wait for the user to return. Calling again while waiting reuses the same link. Never call just to test a connection that already works.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
};
const localTools = [statusTool, connectTool, signInTool];

export async function startConnectionServer(sdkRoot, args) {
  const timeoutIndex = args.indexOf('--auth-timeout');
  const timeoutSeconds = timeoutIndex < 0 ? 300 : Number(args[timeoutIndex + 1]);
  const connectionTimeout = Number.isFinite(timeoutSeconds) && timeoutSeconds > 0 ? timeoutSeconds * 1000 : 300_000;
  const sdk = (file) => import(pathToFileURL(path.join(sdkRoot, 'dist/esm', file)).href);
  const [{ Server }, { StdioServerTransport }, { Client }, { StdioClientTransport }, types] = await Promise.all([
    sdk('server/index.js'), sdk('server/stdio.js'), sdk('client/index.js'), sdk('client/stdio.js'), sdk('types.js'),
  ]);
  const server = new Server({ name: 'Adzviser', version }, {
    capabilities: { tools: { listChanged: true }, resources: { listChanged: true }, prompts: { listChanged: true } },
  });
  const client = new Client({ name: 'Adzviser', version }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, 'oauth-helper.cjs'), ...args],
    env: process.env,
    stderr: 'pipe',
  });
  let conversationAuth;
  let conversationController;
  let authorizationLink;
  let ready;
  let conversationTask;
  let route = 'local';
  let state = 'idle';
  let initialized = false;
  let started = false;
  let closing = false;
  let remoteCapabilities = {};

  function status() {
    const messages = {
      idle: 'This Adzviser helper is idle. Use existing Adzviser data tools if available. Otherwise call adzviser_sign_in for a conversation sign-in link, or adzviser_connect to reuse the existing local Code login.',
      connecting: 'Adzviser is connecting. If a browser sign-in opens, complete it and return to this conversation.',
      awaiting_sign_in: 'Complete the Adzviser sign-in in your browser, then return to this conversation. Your data tools will become available here after authorization finishes.',
      connected: 'Adzviser is connected. Discover its data tools and continue the original request.',
      failed: 'The Adzviser connection could not finish or has closed. Reconnect the Adzviser plugin server in Claude’s MCP controls and retry. Do not reinstall the plugin or enable the directory connector.',
    };
    if (route === 'conversation' && state === 'failed') return {
      state, message: 'Conversation sign-in could not finish. Call adzviser_sign_in to get a fresh link. If that also fails, report the connection failure; do not repeat browser sign-ins or request callback URLs.',
    };
    return { state, message: route === 'conversation' && state === 'awaiting_sign_in' ? 'Show authorization_url as a Connect Adzviser link. After signing in, return to this conversation; the helper receives completion automatically. Do not ask for a callback URL or code.' : messages[state], ...(state === 'awaiting_sign_in' && authorizationLink ? authorizationLink : {}) };
  }
  function statusResult(isError = false) {
    const data = status();
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data, isError };
  }
  async function announceTools() {
    if (initialized && !closing) await server.sendToolListChanged().catch(() => {});
  }
  async function fail() {
    if (closing || state === 'failed') return;
    state = 'failed';
    console.error('[Adzviser] Connection unavailable. Reconnect the plugin server to retry.');
    await announceTools();
  }
  async function forward(request, extra, schema) {
    if (state !== 'connected') throw new types.McpError(types.ErrorCode.InternalError, status().message);
    try {
      const token = request.params?._meta?.progressToken;
      const send = () => client.request({ method: request.method, params: request.params }, schema, {
        signal: extra.signal,
        timeout: 300_000,
        ...(token === undefined ? {} : { onprogress: (progress) => {
          server.notification({ method: 'notifications/progress', params: { ...progress, progressToken: token } }).catch(() => {});
        } }),
      });
      return await (conversationAuth ? conversationAuth.exclusive(send) : send());
    } catch {
      // Never return transport exception text: it may include authorization URLs.
      throw new types.McpError(types.ErrorCode.InternalError, 'Adzviser could not complete this request. Check the connection status and retry when available.');
    }
  }

  server.setRequestHandler(types.ListToolsRequestSchema, async (request, extra) => {
    if (state !== 'connected') return { tools: localTools };
    const result = await forward(request, extra, types.ListToolsResultSchema);
    return { ...result, tools: [...(request.params?.cursor ? [] : localTools), ...result.tools.filter((tool) => ![STATUS_TOOL, CONNECT_TOOL, SIGN_IN_TOOL].includes(tool.name))] };
  });
  server.setRequestHandler(types.CallToolRequestSchema, async (request, extra) => {
    if (request.params.name === STATUS_TOOL) return statusResult();
    if (request.params.name === SIGN_IN_TOOL) {
      if ((!started || (route === 'conversation' && state === 'failed')) && !closing) {
        started = true;
        const previousTask = conversationTask;
        route = 'conversation';
        state = 'connecting';
        authorizationLink = undefined;
        await previousTask?.catch(() => {});
        conversationController?.abort();
        await conversationAuth?.close().catch(() => {});
        await client.close().catch(() => {});
        const waiting = new Promise(resolve => { ready = resolve; });
        conversationTask = connectConversation();
        let timeout;
        await Promise.race([waiting, conversationTask, new Promise(resolve => { timeout = setTimeout(resolve, 8000); })]);
        clearTimeout(timeout);
      }
      return statusResult(state === 'failed');
    }
    if (request.params.name === CONNECT_TOOL) {
      if (!started && !closing) {
        started = true;
        state = 'connecting';
        void connectRemote();
      }
      return statusResult(state === 'failed');
    }
    if (state !== 'connected') return statusResult(true);
    return forward(request, extra, types.CallToolResultSchema);
  });
  for (const [requestSchema, resultSchema, capability, empty] of [
    [types.ListResourcesRequestSchema, types.ListResourcesResultSchema, 'resources', { resources: [] }],
    [types.ListResourceTemplatesRequestSchema, types.ListResourceTemplatesResultSchema, 'resources', { resourceTemplates: [] }],
    [types.ListPromptsRequestSchema, types.ListPromptsResultSchema, 'prompts', { prompts: [] }],
  ]) {
    server.setRequestHandler(requestSchema, (request, extra) => (
      state !== 'connected' || !remoteCapabilities[capability] ? empty : forward(request, extra, resultSchema)
    ));
  }
  server.setRequestHandler(types.ReadResourceRequestSchema, (request, extra) => forward(request, extra, types.ReadResourceResultSchema));
  server.setRequestHandler(types.GetPromptRequestSchema, (request, extra) => forward(request, extra, types.GetPromptResultSchema));
  client.setNotificationHandler(types.ToolListChangedNotificationSchema, announceTools);
  client.setNotificationHandler(types.ResourceListChangedNotificationSchema, () => {
    if (initialized && !closing) return server.sendResourceListChanged().catch(() => {});
  });
  client.setNotificationHandler(types.PromptListChangedNotificationSchema, () => {
    if (initialized && !closing) return server.sendPromptListChanged().catch(() => {});
  });

  // Consume upstream diagnostics without forwarding URLs, codes, or tokens.
  createInterface({ input: transport.stderr }).on('line', (line) => {
    if (state === 'connecting' && /Opening browser|Please authorize this client/.test(line)) state = 'awaiting_sign_in';
  });
  client.onclose = () => { if (state === 'connected' && !closing) return fail(); };
  client.onerror = () => {}; // Request failures are reported above without raw auth logs.

  async function connectConversation() {
    conversationController = new AbortController();
    const deadline = setTimeout(() => conversationController.abort(), connectionTimeout);
    try {
      conversationAuth = await createConversationAuth({
        endpoint: args[0], directory: process.env.MCP_REMOTE_CONFIG_DIR,
        signal: conversationController.signal, sdk, onNeedsSignIn: fail,
        onLink: value => { authorizationLink = value; state = 'awaiting_sign_in'; ready?.(); },
      });
      await conversationAuth.connect(client);
      clearTimeout(deadline);
      if (closing) return;
      authorizationLink = undefined;
      remoteCapabilities = client.getServerCapabilities() || {};
      state = 'connected';
      await announceTools();
    } catch {
      conversationController.abort();
      authorizationLink = undefined;
      await fail();
      await conversationAuth?.close().catch(() => {});
    } finally { clearTimeout(deadline); ready?.(); }
  }

  async function connectRemote() {
    try {
      // This timeout belongs to the OAuth helper connection, not Claude's startup.
      await client.connect(transport, { timeout: connectionTimeout });
      if (closing) return;
      remoteCapabilities = client.getServerCapabilities() || {};
      state = 'connected';
      await announceTools();
      if (remoteCapabilities.resources) await server.sendResourceListChanged().catch(() => {});
      if (remoteCapabilities.prompts) await server.sendPromptListChanged().catch(() => {});
    } catch {
      await fail();
      await client.close().catch(() => {});
    }
  }
  async function shutdown() {
    if (closing) return;
    closing = true;
    conversationController?.abort();
    await conversationTask?.catch(() => {});
    await conversationAuth?.close().catch(() => {});
    await client.close().catch(() => {});
    await server.close().catch(() => {});
  }
  server.oninitialized = () => {
    initialized = true;
  };
  server.onclose = shutdown;
  process.stdin.once('end', shutdown);
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.stdout.on('error', shutdown);
  // Hosts start every bundled server, including in Cowork. Loading this local
  // server must not start a second OAuth flow beside the remote connection.
  // Only an explicit connection tool starts network/authorization work.
  await server.connect(new StdioServerTransport());
}
