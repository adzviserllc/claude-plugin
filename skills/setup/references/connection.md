# Connect to Adzviser

The **Adzviser** plugin supplies its own data connection in a local Claude Code session. Its packaged MCP configuration runs a pinned local `mcp-remote` helper, which connects to Adzviser and handles browser authorization. It does not use the Adzviser directory connector or its saved authorization.

## Check access and continue

1. Preserve the user's requested task, workspace, source, dates, and output in this conversation. Resolve relative dates before any connection pause.
2. Discover tools supplied by **plugin:adzviser:adzviser**. Hosts may normalize the name to `mcp__plugin_adzviser_adzviser__` or replace punctuation with underscores. Search by Adzviser and function name, then check the tool's origin; do not rely on one exact prefix. Do not silently substitute the directory connector: the plugin supplies its own connection.
   If data tools are not available, discover and call **adzviser_connection_status** once. This local tool is available before browser sign-in completes. `connecting` or `awaiting_sign_in` means the plugin has loaded and is waiting for its own connection; it does not mean the plugin is missing. After the user returns from sign-in, check once, rediscover the data tools, and continue in this same conversation.
3. For setup and connected-account reporting, call this connection's `list_workspace`. Reuse a current result if it already covers the task. For public ad-library or PageSpeed requests, discover the relevant tools without requiring a connected advertising account.
4. After a successful call, continue the user's original task. Ask about workspace selection only when multiple workspaces fit. Do not announce a technical preflight or request another setup command.

## When access is unavailable

An available skill proves the workflow loaded, not that the data connection succeeded. Missing tools do not establish an expired credential, a dropped connection, or a service outage.

- **Sign-in pending:** when the status tool reports `connecting` or `awaiting_sign_in`, explain that the plugin is connecting and ask the user to finish the browser sign-in if it opens. Data tools are announced automatically after authorization; a new conversation is not needed. Do not repeatedly search for tools, schedule polling, or prescribe reinstalls while sign-in is pending. The helper may show the registered client name **Adzviser**. Never ask for passwords, API keys, authorization codes, or tokens in chat.
- **No tools and no sign-in window:** ask for the Adzviser server's non-secret status/error in Claude's MCP controls (`/mcp` where supported). Check that the plugin is enabled, the session is local, and Node.js 22.12+ with npm is available to Desktop. A missing `npx` executable is a local runtime problem. Do not send the user to enable or install the directory connector.
- **The status tool reports `failed`:** use Claude's MCP controls to reconnect the Adzviser plugin server and retry once. This can happen if browser authorization is not completed within five minutes or the remote connection fails. Reuse saved authorization when available; do not request a logout or remove credentials.
- **An older release timed out during initial sign-in:** update to 1.1.0-rc.3 or later, which answers the local startup request before waiting for browser authorization. Some Claude versions cache a failed plugin startup for 15 minutes, so a new conversation alone may repeat the old failure. Use an explicit server reconnect, or wait for the cached failure to expire before retrying. Never edit the user's authentication files.
- **Organization policy blocks local MCP servers:** report that restriction and the applicable administrator action. Do not change settings or use another transport to evade the policy.
- **Permission, subscription, or missing-source error:** explain the actual returned restriction. A successful workspace lookup with no matching source means the user needs [Adzviser account setup](https://adzviser.com/set-up), not another Claude login.
- **Network/server error:** report the actual failure and retry only when appropriate. Do not prescribe sign-in for a network error.

After the user completes a connection step, rediscover the plugin's tools and retry the requested read once. Continue with the established task if it works. If still unavailable, stop the loop and collect only the visible status/error for [Adzviser support](https://adzviser.com/contact-us). Never request raw authentication logs or full configuration files.

Do not create another MCP configuration, run ad hoc shell OAuth clients, construct login URLs, or copy credentials from the directory connector, browser, or another CLI. Only the helper declared in this plugin's `.mcp.json` performs authorization. It stores its own credentials in this plugin's persistent data directory; those credentials are not shared with the directory connector.
