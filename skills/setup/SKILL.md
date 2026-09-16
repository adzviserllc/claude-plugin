---
name: setup
description: Connect Adzviser and discover available workspaces, source accounts, and reporting fields. Use for Adzviser onboarding, connection troubleshooting, or questions about which data is available.
---

# Set up Adzviser

The plugin declares an OAuth MCP connection to `https://mcp.adzviser.com/http`. Installation, skill activation, and an authenticated data connection are separate states. An Adzviser account and access to the requested sources are required.

1. Check whether an Adzviser `list_workspace` tool is exposed in this session, including through the host's tool discovery if available. Claude Code may prefix the plugin's tool with `mcp__plugin_adzviser_adzviser__`. Call an available Adzviser workspace tool and report actual workspaces and source accounts. If only an existing directory connector supplies that tool, it can serve normal reporting; for a plugin-installation test, explain that this does not establish that the bundled connection loaded.
2. If the tool is absent, say that it is unavailable in this session. Do not claim the connection "dropped" or credentials expired without an actual connection status or tool error establishing that. If a call fails, distinguish an authentication error from a network error, missing tool, or disabled connector, then use the relevant host controls below.
3. If no workspace contains the requested source, explain what is missing and link to [Adzviser setup](https://adzviser.com/set-up) and the [workspace guide](https://docs.adzviser.com/getStarted/workspace). Connecting a plugin does not create a workspace or connect advertising accounts.
4. If the user asks about available fields, call the relevant discovery tool for that source. Do not enumerate every source's catalog just to complete setup.
5. Explain which requested reports can now run. Offer an example appropriate to their connected sources, such as “Compare Google Ads and Meta Ads last week.”

If multiple workspaces match and the intended account is unclear, ask for the workspace before fetching its reports. Public competitor-ad and PageSpeed requests do not require a workspace; Adzviser authentication and access requirements still apply.

## Connection controls

Use known host context; ask which host the user is in only if it is unclear.

- **Claude Code in a terminal:** open `/mcp`, inspect the Adzviser server's status, and authenticate if required. The plugin server can appear as `plugin:adzviser:adzviser`.
- **Code tab in Claude Desktop:** use **+ beside the prompt → Connectors → Manage connectors** to inspect the connection. Use **+ → Plugins** or the slash-command picker to check that this session has Adzviser's skills. Do not assume the terminal `/mcp` dialog is available in Desktop. Plugin availability also depends on the selected environment; use a new Local session for a desktop installation test, and check the selected project's plugin scope if skills are missing.
- **Cowork or Chat:** inspect Adzviser under **Customize → Connectors** and use the connection's sign-in controls if needed. Inspect **Customize → Plugins** separately for plugin enablement.

For an activation test, select `/adzviser:setup` from the host's skill picker when available. If it is absent, troubleshoot session loading or plugin scope before asking the user to reconnect accounts. A disabled existing connector can explain missing data tools; it does not establish whether the plugin's skills loaded. Do not change connector settings automatically or claim a plugin-specific connection test passed just because another connector supplied the data.

Sign in through the browser; never ask for passwords or tokens in chat. If the host shows no plugin MCP connection, ask for the relevant connection status or error rather than repeatedly instructing the user to authenticate an entry that is not present.

Do not request an API key for this OAuth plugin, duplicate an existing MCP configuration, or change unrelated project instructions. For persistent errors, use [troubleshooting](https://docs.adzviser.com/troubleshoot) or [contact Adzviser](https://adzviser.com/contact-us).
