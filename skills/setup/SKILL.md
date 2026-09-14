---
name: setup
description: Connect Adzviser and discover available workspaces, source accounts, and reporting fields. Use for Adzviser onboarding, connection troubleshooting, or questions about which data is available.
---

# Set up Adzviser

The plugin connects to `https://mcp.adzviser.com/http` using Claude's OAuth flow. An Adzviser account and access to the requested sources are required. Use the Adzviser MCP tools exposed in this session; Claude Code may prefix them with `mcp__plugin_adzviser_adzviser__`.

1. Call `list_workspace` to check the connection and list workspace names and their connected source accounts.
2. If authentication is needed, direct the user to the host's MCP authentication flow. In Claude Code, use `/mcp`, select the Adzviser server, and authenticate. In Cowork, use the plugin's connection controls. Sign in through the browser; never ask for passwords or tokens in chat.
3. If no workspace contains the requested source, explain what is missing and link to [Adzviser setup](https://adzviser.com/set-up) and the [workspace guide](https://docs.adzviser.com/getStarted/workspace). Connecting a plugin does not create a workspace or connect advertising accounts.
4. If the user asks about available fields, call the relevant discovery tool for that source. Do not enumerate every source's catalog just to complete setup.
5. Explain which requested reports can now run. Offer an example appropriate to their connected sources, such as “Compare Google Ads and Meta Ads last week.”

If multiple workspaces match and the intended account is unclear, ask for the workspace before fetching its reports. Public competitor-ad and PageSpeed requests do not require a workspace; Adzviser authentication and access requirements still apply.

Do not request an API key for this OAuth plugin, duplicate an existing MCP configuration, or change unrelated project instructions. For persistent errors, use [troubleshooting](https://docs.adzviser.com/troubleshoot) or [contact Adzviser](https://adzviser.com/contact-us).
