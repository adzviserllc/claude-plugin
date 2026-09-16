---
name: setup
description: Connect Adzviser and discover available workspaces, source accounts, and reporting fields. Use for Adzviser onboarding, connection troubleshooting, or questions about which data is available.
---

# Set up Adzviser

The plugin references the OAuth MCP service at `https://mcp.adzviser.com/http`. Installation, skill activation, and an authenticated data connection are separate states. An Adzviser account and access to the requested sources are required. In Claude Desktop, the plugin and an existing Adzviser directory connector can share one connection. Keep that connector enabled; do not ask users to disable it to prove that the plugin works.

1. Check whether an Adzviser `list_workspace` tool is exposed in this session, including through the host's tool discovery if available. Search by function and service name, not only by a specific prefix: terminal Claude Code may use `mcp__plugin_adzviser_adzviser__`, while Desktop may expose tools through its connector. Call an available Adzviser workspace tool and report actual workspaces and source accounts. Using the shared connector is a supported way to run the plugin's workflow; a second plugin-specific tool connection is not required.
2. If the tool is absent, say that it is unavailable in this session. Do not claim the connection "dropped" or credentials expired without an actual connection status or tool error establishing that. If a call fails, distinguish an authentication error from a network error, missing tool, or disabled connector, then use the relevant host controls below.
3. If no workspace contains the requested source, explain what is missing and link to [Adzviser setup](https://adzviser.com/set-up) and the [workspace guide](https://docs.adzviser.com/getStarted/workspace). Connecting a plugin does not create a workspace or connect advertising accounts.
4. If the user asks about available fields, call the relevant discovery tool for that source. Do not enumerate every source's catalog just to complete setup.
5. Explain which requested reports can now run. Offer an example appropriate to their connected sources, such as “Compare Google Ads and Meta Ads last week.”

If multiple workspaces match and the intended account is unclear, ask for the workspace before fetching its reports. Public competitor-ad and PageSpeed requests do not require a workspace; Adzviser authentication and access requirements still apply.

## Connection controls

Use known host context. The phrase "Claude Code" alone does not distinguish a terminal from the Code tab in Claude Desktop. If the host is unclear, ask whether they are in Desktop or a terminal, or briefly provide both sets of controls. Do not default to a standalone `/mcp` instruction.

- **Claude Code in a terminal:** open `/mcp`, inspect the Adzviser server's status, and authenticate if required. The plugin server can appear as `plugin:adzviser:adzviser`.
- **Code tab in Claude Desktop:** use **+ beside the prompt → Connectors** to enable Adzviser for the conversation. Open **Manage connectors** if account connection or browser sign-in is needed. Keep the plugin enabled too. If the skill is available but the tools are absent, first check that the Adzviser connector is enabled; installing a plugin does not override a disabled connection. Desktop can manage the remote connection itself instead of exposing a separately authenticated plugin server. Do not assume the terminal `/mcp` dialog is available. Use **+ → Plugins** or the slash-command picker to check skills. Some Desktop versions list `/setup` with **(adzviser)** in its description; select that entry if `/adzviser:setup` is not offered. `/adzviser` alone is not a skill command.
- **Cowork or Chat:** inspect Adzviser under **Customize → Connectors** and use the connection's sign-in controls if needed. Inspect **Customize → Plugins** separately for plugin enablement.

For an activation test, select the Adzviser setup skill using the name offered by the host's picker. If neither `/adzviser:setup` nor the Adzviser `/setup` entry is available, troubleshoot session loading or plugin scope before asking the user to reconnect accounts. Use a Local Code session in an ordinary working folder for a Desktop test. If the skill and an authenticated workspace call both work through the shared connector, report that result accurately; it does not establish a separate terminal OAuth test or a first-time customer installation. Do not change connector settings automatically.

Sign in through the browser; never ask for passwords or tokens in chat. If the host shows no plugin MCP connection, ask for the relevant connection status or error rather than repeatedly instructing the user to authenticate an entry that is not present.

Do not request an API key for this OAuth plugin, duplicate an existing MCP configuration, or change unrelated project instructions. For persistent errors, use [troubleshooting](https://docs.adzviser.com/troubleshoot) or [contact Adzviser](https://adzviser.com/contact-us).
