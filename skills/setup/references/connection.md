# Connect to Adzviser

The **Adzviser** plugin bundles two routes to the same reporting service. Use the route available in this session; the user does not need to authenticate both.

- **Remote connection (`cloud`):** standard HTTP MCP at `https://mcp.adzviser.com/http`. Claude manages its OAuth sign-in. This is the route for Cowork and other hosts that cannot start local processes. Claude may display the connection as **Adzviser**, match it to the existing directory entry, or assign its own tool prefix. Its local helper and `adzviser_connection_status` tool are not required for remote access.
- **Local connection (`analytics`):** the existing Claude Code helper, with its own browser sign-in and saved authorization. Use it when its tools are available. It runs only where the host permits local Node.js processes. Adding the remote route does not migrate or clear this saved login.

## Check access and continue

1. Preserve the user's requested task, workspace, source, dates, and output. Resolve relative dates before any connection pause.
2. Search the available tools for Adzviser and the required function, such as `list_workspace`. Verify the service and tool origin rather than requiring an exact prefix. Claude Code may expose `plugin:adzviser:analytics` or `plugin:adzviser:cloud`; normalized tool names may begin `mcp__plugin_adzviser_analytics__` or `mcp__plugin_adzviser_cloud__`. Older local versions used `plugin:adzviser:adzviser`. Cowork may use the name of the remote connection it provisioned.
3. If usable data tools are present, use them directly. In local Code, prefer the working `analytics` route; otherwise use the available Adzviser remote route. If both are connected, use one consistently for this task and avoid duplicate requests or another sign-in. Do not assume two connections have the same signed-in account. If their workspace results conflict, ask which account to use.
4. For setup and connected-account reporting, call the selected connection's `list_workspace`. Reuse a current result if it already covers the task. For public ad-library or PageSpeed requests, discover the relevant tools without requiring a connected advertising account.
5. After a successful call, continue the original task. Ask about workspace selection only when multiple workspaces fit. Do not announce a technical preflight or request another setup command.

## When data tools are unavailable

An available skill proves the workflow loaded, not that the connection succeeded. Missing tools do not establish an expired credential, a dropped connection, or a service outage.

### Cowork or another remote host

If Claude provides a connection or authorization action for Adzviser, use that supported action. Otherwise guide the user to the Adzviser plugin's connection setup and complete **Connect / Sign in** for its remote Adzviser connection. Labels vary by host. If Claude sends them to **Customize → Connectors → Adzviser**, explain that Claude manages the plugin's remote authorization there. Do not make them search the directory for another plugin or promise that a URL-matched directory entry stays disconnected.

After sign-in, rediscover the data tools once and resume the pending request. A successful `list_workspace` call establishes access. Remote access does not need Node.js, npm, a localhost page, or the local status tool. Do not send a Cowork user to `/mcp` unless that host actually offers it.

If installing or updating the plugin did not provision a remote connection, report that specific gap and request the visible plugin connection status for support. Do not claim it is connected because its manifest lists a server. Do not loop through reinstalls, invent a login link, create an artifact to bypass missing tools, or report workspaces from memory as current data.

### Local Claude Code

When data tools are absent, discover and call **adzviser_connection_status** once if available. `connecting` or `awaiting_sign_in` means the local helper is loaded and waiting for its connection. Explain that the user should finish its browser sign-in if it opens. After they return, check once, rediscover data tools, and continue in the same conversation. Do not require the remote connection's sign-in when the local route works.

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
