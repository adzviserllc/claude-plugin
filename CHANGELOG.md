# Release notes

## 1.3.0 — conversation sign-in preview

- Adds a Connect Adzviser link through `adzviser_sign_in`, with an Adzviser-hosted OAuth callback and private completion delivery to the plugin helper.
- Reuses saved authorization, serializes concurrent refresh, and handles denial, expiry, and shutdown without passing codes or tokens through chat.
- Keeps the existing local Code login and working Claude-managed connectors. Hosts without the helper still use native remote authentication.
- Requires the accompanying MCP server callback service to be deployed and enabled. Actual Cowork link completion and persistence still require acceptance testing.

## 1.2.1 — 2026-09-16

Fix the extra local browser sign-in when opening Cowork after authorizing the remote Adzviser connection. The local `analytics` server now starts idle; loading it, listing tools, or checking status does not start OAuth. The `adzviser_connect` tool starts local access on demand, and repeated calls do not launch additional helpers.

The setup guidance uses the remote connection in Cowork and starts the local connection only for local Claude Code. Saved local credentials, remote configuration, and the OAuth client are unchanged. Local Code sessions initially expose status and connect tools; setup starts the connection and the data tools appear in the same session.

Cowork 1.2.0 installation and a remote Connected state were observed, alongside the duplicate local sign-in. The new startup behavior, live reports, and authorization reuse still need actual Cowork acceptance. This change does not resolve callback-port contention between independently authorized local helpers.

## 1.2.0 — 2026-09-16

Cowork connection preview: the single Adzviser plugin now includes a standard remote HTTP connection (`cloud`) to the existing Adzviser MCP service, alongside the working local Claude Code connection (`analytics`). No backend deployment is needed.

Claude manages remote sign-in and may match the bundled URL to the existing Adzviser connector. A connection can therefore appear under Connectors even when installed through the plugin. Separate remote credentials or a disabled directory entry are not guaranteed. Only one usable route is needed; the local helper and its saved-login location are unchanged.

The shared skill guidance now handles both routes, avoids requiring the local status tool in Cowork, and continues the user's task after sign-in. It does not substitute remembered workspace names or an artifact for missing data tools.

This release is a candidate for actual Cowork acceptance. Remote OAuth/MCP integration is tested with synthetic credentials; it does not prove that Cowork provisions or authorizes the connection. Follow the Cowork checklist before claiming support or submitting an updated directory listing.

## 1.1.2 — 2026-09-16

The Adzviser plugin's data connection is now named **analytics**, so Claude identifies it as **plugin:adzviser:analytics**. The plugin remains **Adzviser**, and its skill commands stay the same.

The connection guide now recognizes the new name and the earlier name during upgrades. The plugin identity, OAuth client, service endpoint, and saved-login location are unchanged. Any custom tool permission rules targeting the old connection name need the new name; Claude may ask for tool approval again.

Refresh the marketplace, update Adzviser, and restart Claude Code or fully quit and reopen Claude Desktop to load the new connection name. No backend deployment is needed. Supported environments are unchanged.

## 1.1.1 — 2026-09-16

The browser sign-in confirmation now says **Return to your conversation** and directs you back to where you started sign-in. Both success and error messages use the same wording across apps and terminal sessions instead of naming Claude Desktop.

This update changes callback copy only. Authentication, saved-login storage, skills, and supported environments are unchanged. Refresh the marketplace, update Adzviser, and restart the host to load it. No backend deployment is needed.

## 1.1.0 — 2026-09-16

Adzviser is now one plugin with eight workflows, a marketing analyst agent, and its own browser sign-in for local Claude Code. The separate Adzviser directory connector is not required.

- Keeps the local connection available while browser sign-in completes, then exposes data tools in the same conversation. This fixes the first-sign-in startup timeout.
- Provides connection status while waiting and reuses saved authorization in subsequent sessions.
- Consolidates the earlier Desktop experiment into one **Adzviser** plugin and one **adzviser** server.
- Adds a branded sign-in confirmation page with clear instructions for returning to Claude Desktop.

This release promotes 1.1.0-rc.3 without changing its runtime or skills. Existing rc.3 users receive a simpler version label and updated documentation; their saved-login location is unchanged. No backend deployment is required.

### Verification and limits

Linux Desktop Code testing confirmed real workspace access, Google Ads reporting, period comparison, and access in a new conversation. Screenshots show the plugin's own tool calls and missing-data handling; the full comparison analysis was not visible. Automated tests cover OAuth, saved-login reuse, token refresh, abandoned sign-in, and a 40-second sign-in with tools appearing in the same Claude Code session.

A manual delayed first sign-in and comparison against source-platform reports remain outstanding. Cowork, Chat, remote Code, macOS, and Windows have not been verified. Local Claude Code requires Node.js 22.12+ and npm.

### Update

Refresh the Adzviser marketplace, update the installed Adzviser plugin, then fully quit and reopen Claude Desktop. Closing only the window may leave the old process running. Confirm that the plugin details show **1.1.0**.

The GitHub release and repository marketplace are separate from Anthropic's directory review.
