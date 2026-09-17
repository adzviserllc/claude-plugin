import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline';
import { readFileSync } from 'node:fs';

const root = path.dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(readFileSync(path.join(root, '../.claude-plugin/plugin.json'), 'utf8')).version;
const STATUS_TOOL = 'adzviser_connection_status';
const CONNECT_TOOL = 'adzviser_connect';
const statusTool = {
  name: STATUS_TOOL,
  title: 'Adzviser connection status',
  description: 'Read the local Adzviser connection status without starting sign-in. In local Claude Code, call adzviser_connect if idle and local access is needed. In Cowork, use the remote Adzviser connection. If local sign-in is pending, check once after the user returns, then discover data tools and continue their request. Do not poll repeatedly.',
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
const localTools = [statusTool, connectTool];

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
  let state = 'idle';
  let initialized = false;
  let started = false;
  let closing = false;
  let remoteCapabilities = {};

  function status() {
    const messages = {
      idle: 'The local Adzviser connection has not been started. In local Claude Code, call adzviser_connect when local data access is needed. In Cowork, use the remote Adzviser connection and its Connect / Sign in control.',
      connecting: 'Adzviser is connecting. If a browser sign-in opens, complete it and return to this conversation.',
      awaiting_sign_in: 'Complete the Adzviser sign-in in your browser, then return to this conversation. Your data tools will become available here after authorization finishes.',
      connected: 'Adzviser is connected. Discover its data tools and continue the original request.',
      failed: 'The Adzviser connection could not finish or has closed. Reconnect the Adzviser plugin server in Claude’s MCP controls and retry. Do not reinstall the plugin or enable the directory connector.',
    };
    return { state, message: messages[state] };
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
      return await client.request({ method: request.method, params: request.params }, schema, {
        signal: extra.signal,
        timeout: 300_000,
        ...(token === undefined ? {} : { onprogress: (progress) => {
          server.notification({ method: 'notifications/progress', params: { ...progress, progressToken: token } }).catch(() => {});
        } }),
      });
    } catch {
      // Never return transport exception text: it may include authorization URLs.
      throw new types.McpError(types.ErrorCode.InternalError, 'Adzviser could not complete this request. Check the connection status and retry when available.');
    }
  }

  server.setRequestHandler(types.ListToolsRequestSchema, async (request, extra) => {
    if (state !== 'connected') return { tools: localTools };
    const result = await forward(request, extra, types.ListToolsResultSchema);
    return { ...result, tools: [...(request.params?.cursor ? [] : localTools), ...result.tools.filter((tool) => ![STATUS_TOOL, CONNECT_TOOL].includes(tool.name))] };
  });
  server.setRequestHandler(types.CallToolRequestSchema, async (request, extra) => {
    if (request.params.name === STATUS_TOOL) return statusResult();
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
  client.onclose = fail;
  client.onerror = () => {}; // Request failures are reported above without raw auth logs.

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
  // Only the explicit local connect tool starts network/authorization work.
  await server.connect(new StdioServerTransport());
}
