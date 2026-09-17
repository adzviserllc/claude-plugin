# Connect to Adzviser

The **Adzviser** plugin offers a Claude-managed remote connection and a plugin helper. Use an already working data connection first; the user does not need to authenticate every route.

- **Plugin helper (`analytics`):** exposes `adzviser_sign_in` for a sign-in link in the conversation. It receives authorization through an Adzviser-hosted return page, without localhost or pasting codes. This works only where Claude runs the bundled Node.js helper; a plugin installation alone does not prove that capability. The existing `adzviser_connect` tool retains the local Code browser login and its saved credentials.
- **Claude-managed remote connection (`cloud`):** standard HTTP MCP at `https://mcp.adzviser.com/http`. Claude owns its authorization. It may display this as Adzviser or match the directory entry. Hosts without the helper use their own supported sign-in action. The plugin cannot replace that host's callback handling or promise universal web/Chat support.

## Check access and continue

1. Preserve the user's requested task, workspace, source, dates, and output. Resolve relative dates before any connection pause.
2. Search the available tools for Adzviser and the required function, such as `list_workspace`. Verify the service and tool origin rather than requiring an exact prefix. Claude Code may expose `plugin:adzviser:analytics` or `plugin:adzviser:cloud`; normalized tool names may begin `mcp__plugin_adzviser_analytics__` or `mcp__plugin_adzviser_cloud__`. Older local versions used `plugin:adzviser:adzviser`. Cowork may use the name of the remote connection it provisioned.
3. If usable data tools are present, use them directly. In local Code, prefer the working `analytics` route; otherwise use the available Adzviser remote route. If both are connected, use one consistently for this task and avoid duplicate requests or another sign-in. Do not assume two connections have the same signed-in account. If their workspace results conflict, ask which account to use.
4. For setup and connected-account reporting, call the selected connection's `list_workspace`. Reuse a current result if it already covers the task. For public ad-library or PageSpeed requests, discover the relevant tools without requiring a connected advertising account.
5. After a successful call, continue the original task. Ask about workspace selection only when multiple workspaces fit. Do not announce a technical preflight or request another setup command.

## When data tools are unavailable

An available skill proves the workflow loaded, not that the connection succeeded. Missing tools do not establish an expired credential, a dropped connection, or a service outage.

### Sign in from the conversation

If working Adzviser data tools are absent, search for **adzviser_sign_in** from this plugin. In Cowork, prefer that tool when it is available. Call it once. It reuses its saved authorization or returns `authorization_url` for a new sign-in.

- **`connected`:** rediscover data tools, call `list_workspace` and continue the pending request.
- **`awaiting_sign_in` with `authorization_url`:** show the exact returned URL as a short **[Connect Adzviser](returned URL)** link. Say “Sign in, then return here and I’ll continue.” Do not paste the raw long URL, construct a URL, automatically open a second browser, or send the user to connector settings first. The helper receives completion without asking for codes or callback URLs.
- **`connecting`:** a saved connection or link is being prepared. Check `adzviser_connection_status` once after a brief wait; it also returns the pending link when ready. Do not claim a browser has opened or that sign-in completed.
- After the user returns, read status once and rediscover tools. Resume the original request in this conversation. If data tools are still unavailable, report the actual state. A hosted “Sign-in received” page alone does not establish access.
- **`failed`:** offer one fresh attempt with `adzviser_sign_in`. Expired or abandoned links cannot be reused. If it fails again, report the non-secret error and use the host's supported connection controls as recovery. Do not switch accounts or repeat sign-ins indefinitely.

The helper starts idle and never opens a browser merely because the plugin or its tools loaded. Do not call either sign-in tool when an existing Adzviser connection already serves the request. Do not disconnect a working Claude-managed connector to test this flow. The helper's saved conversation authorization is separate from the connector and from the legacy local login; it does not copy either one's credentials.

### Hosts without the conversation sign-in tool

If `adzviser_sign_in` is unavailable, use Claude's supported remote authorization action when offered, and show its provided link. Do not invent an action or a URL. Some Cowork hosts return a localhost callback that the browser cannot reach. Our helper's hosted return page does not change that native flow. If that happens, explain the host callback limitation and use the plugin's **Connectors → Adzviser → Connect** action as recovery. Do not request callback URLs in the conversation or invoke the old local `adzviser_connect` as a Cowork workaround.

If no remote connection was provisioned either, report that specific gap and request the visible plugin connection status. Do not request Node installation in remote-only hosts, loop through reinstalls, create an artifact to bypass missing tools, or report workspaces from memory as current data.

### Local Claude Code

When data tools are absent, discover and call **adzviser_connection_status** once if available. If it reports `idle`, call **adzviser_connect** once to start local access and reuse any saved login. This tool starts the helper; a `connecting` result is not a completed login. `connecting` or `awaiting_sign_in` means the helper is waiting for its connection. Explain that the user should finish its browser sign-in if it opens. After they return, check once, rediscover data tools, and continue in the same conversation. Do not require the remote connection's sign-in when the local route works.

Each new local Code session starts idle, even when authorization is saved. Starting the local connection reuses that saved authorization; do not ask the user to sign in unless the helper actually requires it. The setup skill can call the connection tool as part of the original data request; the user does not need a separate setup command.

- **No local tools or sign-in window:** check the plugin's server status in `/mcp`, plugin enablement, and Node.js 22.12+ with npm availability. Do not interpret a separate `cloud` entry needing authentication as a failure of the working `analytics` entry.
- **Local status reports `failed`:** use Claude's MCP controls to reconnect `analytics` and retry once. Reuse saved authorization; do not request a logout or remove credentials. The browser sign-in deadline is five minutes.
- **An old release timed out during initial sign-in:** update to 1.1.0-rc.3 or later and reconnect the local server. Some Claude versions cache failed startup for 15 minutes. Never edit authentication or failure-cache files.

## Errors and authorization boundaries

- **Authentication required:** follow the selected connection's actual authorization action. Never ask for passwords, API keys, authorization codes, or tokens in chat.
- **Permission, subscription, or missing-source error:** explain the actual restriction. A successful workspace lookup with no matching source requires [Adzviser account setup](https://adzviser.com/set-up), not another Claude login.
- **Network/server error:** report the failure and retry only when appropriate. Do not prescribe sign-in for a network error.
- **Organization policy:** report the restriction and the relevant administrator action. Do not switch transports to evade a policy.

Do not create another MCP configuration, run ad hoc OAuth clients, construct login URLs, or copy credentials between the local helper, Claude's remote connection, the directory connector, the browser, or another CLI. The local route's declared helper owns its authorization files; Claude owns remote authorization. The plugin cannot force Claude to store two independent remote identities for the same URL.

If access remains unavailable after the relevant connection step and one retry, preserve the pending task and collect only the visible non-secret status/error for [Adzviser support](https://adzviser.com/contact-us). Never request raw authentication logs or full configuration files.
