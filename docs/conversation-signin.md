# Conversation sign-in (1.3.0 preview)

## User flow

Ask for workspaces → **Connect Adzviser** link → browser consent → hosted **Sign-in received** page → return to the conversation → live `list_workspace`. The helper completes the handshake automatically. A model turn is still needed to retrieve the data; tool-list notifications do not guarantee Claude starts a new turn by itself.

The helper must be available in the host. This has been tested against synthetic OAuth, including the actual new MCP service router. Real Cowork acceptance is pending. Web/Chat hosts that cannot run this helper are not covered by the new flow.

## Implementation

The existing `analytics` stdio server starts idle. `adzviser_sign_in` uses the pinned MCP SDK's normal OAuth discovery, registration, S256 PKCE, token exchange and refresh against `/http`. It registers `https://mcp.adzviser.com/plugin-auth/callback` as its redirect. The default `cloud` HTTP entry and legacy `adzviser_connect` are retained.

Before showing the SDK-generated authorization URL, the helper creates a five-minute delivery mailbox. Its public state, client ID and PKCE challenge are bound to a private random polling secret. Only a hash of that secret is stored in Redis. The callback checks the authorization code's existing client/PKCE binding before depositing it. A forged, expired, or cross-client callback cannot complete the pending flow. Only the helper holding the poll secret receives the code and exchanges it with its private PKCE verifier. These values never enter tool results or chat.

The browser receives a 303 redirect to a static result page, removing the code from the displayed URL. Pages use no external resources, no-referrer and no-store headers. Do not enable request-query/header logging on `/plugin-auth/callback` or `/plugin-auth/poll` in proxies or diagnostics.

The helper stores only registered-client metadata and tokens under `${CLAUDE_PLUGIN_DATA}/auth/conversation/`, with owner-only directory/file modes and atomic writes. PKCE verifiers and poll secrets are memory-only and expire with the request. `proper-lockfile@4.1.2` serializes cache access across sessions and reclaims stale locks after a crash. It does not import credentials from the directory connector or legacy local helper.

Mailbox creation is bounded by input limits, five-minute TTL and a per-source creation throttle. Existing OAuth consent remains mandatory. This mailbox is a delivery mechanism for normal OAuth, not an unauthenticated MCP endpoint or a token issuer.

## Deployment order

1. Build/test the MCP service changes in `src/auth/conversationSignIn.ts`, its router mount in `src/index.ts`, and `tests/conversation-signin.test.ts`.
2. Deploy those changes to the existing MCP service with `ADZVISER_CONVERSATION_SIGNIN=true`. The endpoints are disabled by default. Enable only on `mcp.adzviser.com`; other connector domains retain their existing behavior.
3. Check the hosted result page, then test a fresh plugin conversation with a dedicated account. Do not use production access tokens in scripts or logs.
4. Publish the plugin 1.3.0 marketplace update only once the backend is reachable. Update via GitHub; do not patch an installed cache.
5. Verify actual workspace retrieval, a second conversation, app restart, delayed consent, denial and retry. Keep the release labeled a preview until these checks pass.

Rollback: disable the feature flag and roll back the plugin marketplace release together. Existing local Code and Claude-managed remote credentials are unaffected. Do not delete user authentication caches.

## Tests

Standalone plugin suite:

```bash
npx --yes --ignore-scripts --package=mcp-remote@0.14.2 --package=@modelcontextprotocol/sdk@1.30.0 --package=proper-lockfile@4.1.2 node scripts/conversation-signin.test.cjs
```

To exercise the actual backend router, build the MCP service and set `CONVERSATION_SIGNIN_ROUTER` to the absolute path of `dist/auth/conversationSignIn.js` when running the same suite. All browser consent, workspaces, codes, tokens and caches in these tests are synthetic. No directory connector, local callback listener or model request is used.
