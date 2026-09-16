# Independent Adzviser connection

This is the experimental **adzviser-desktop** edition for a local Claude Code session. Its packaged MCP configuration runs a pinned local `mcp-remote` helper, which connects to Adzviser and handles browser authorization. It does not use the Adzviser directory connector or its saved authorization.

## Check access and continue

1. Preserve the user's requested task, workspace, source, dates, and output in this conversation. Resolve relative dates before any connection pause.
2. Discover tools supplied by **plugin:adzviser-desktop:adzviser-independent**. Hosts may normalize the name to `mcp__plugin_adzviser-desktop_adzviser-independent__` or replace punctuation with underscores. Search by Adzviser and function name, then check the tool's origin; do not rely on one exact prefix. Do not silently substitute the directory connector: this edition promises an independent connection.
3. For setup and connected-account reporting, call this connection's `list_workspace`. Reuse a current result if it already covers the task. For public ad-library or PageSpeed requests, discover the relevant tools without requiring a connected advertising account.
4. After a successful call, continue the user's original task. Ask about workspace selection only when multiple workspaces fit. Do not announce a technical preflight or request another setup command.

## When access is unavailable

An available skill proves the workflow loaded, not that the data connection succeeded. Missing tools do not establish an expired credential, a dropped connection, or a service outage.

- **Sign-in pending:** ask the user to complete the Adzviser browser sign-in opened by the plugin's helper, then return to the same task. The helper may show the registered client name **Adzviser-Desktop-Plugin**. Never ask for passwords, API keys, authorization codes, or tokens in chat.
- **No tools and no sign-in window:** ask for the independent server's non-secret status/error in Claude's MCP controls (`/mcp` where supported). Check that this edition is enabled, the session is local, and Node.js 22.12+ with npm is available to Desktop. A missing `npx` executable is a local runtime problem. Do not send the user to enable or install the directory connector.
- **The host timed out during initial sign-in:** reconnect the independent server or start a new local session in the same ordinary working folder. Retry the original read once. The helper's saved authorization can be reused if sign-in completed. Do not promise that a restart will fix an unobserved problem.
- **Organization policy blocks local MCP servers:** report that restriction and the applicable administrator action. Do not change settings or use another transport to evade the policy.
- **Permission, subscription, or missing-source error:** explain the actual returned restriction. A successful workspace lookup with no matching source means the user needs [Adzviser account setup](https://adzviser.com/set-up), not another Claude login.
- **Network/server error:** report the actual failure and retry only when appropriate. Do not prescribe sign-in for a network error.

After the user completes a connection step, rediscover this edition's tools and retry the requested read once. Continue with the established task if it works. If still unavailable, stop the loop and collect only the visible status/error for [Adzviser support](https://adzviser.com/contact-us). Never request raw authentication logs or full configuration files.

Do not create another MCP configuration, run ad hoc shell OAuth clients, construct login URLs, or copy credentials from the directory connector, browser, or another CLI. Only the helper declared in this plugin's `.mcp.json` performs authorization. It stores its own credentials in this plugin's persistent data directory; those credentials are not shared with the directory connector.
