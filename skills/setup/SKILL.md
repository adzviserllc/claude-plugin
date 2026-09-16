---
name: setup
description: Connect Adzviser and discover available workspaces, source accounts, and reporting fields. Use for Adzviser onboarding, connection troubleshooting, or questions about which data is available.
---

# Set up Adzviser

Read the [connection guidance](references/connection.md). Check actual access before asking the user to sign in. If a connection step is necessary, give only the relevant next action and continue the original request after the user completes it.

1. Use the workspace result from the connection check to report the actual workspaces and source accounts. Do not call `list_workspace` again just to complete this skill. Using the shared connection is sufficient; a second plugin-specific connection is not required.
2. If access fails, follow the connection guidance and pause. Do not present invented accounts or a completed setup screen. If workspace lookup succeeds, say what is available in a compact table or sentence; do not show the user the internal connection checks.
3. If no workspace contains the requested source, explain what is missing and link to [Adzviser setup](https://adzviser.com/set-up) and the [workspace guide](https://docs.adzviser.com/getStarted/workspace). Connecting a plugin does not create a workspace or connect advertising accounts.
4. If the user asks about available fields, call the relevant discovery tool for that source. Do not enumerate every source's catalog just to complete setup.
5. If the user already requested a report, read its relevant skill and continue without requiring another command. Otherwise, suggest one useful first report based on the connected sources, such as “Compare Google Ads and Meta Ads last week” only when both are available. Do not pull a full report without a request.

If multiple workspaces match and the intended account is unclear, ask for the workspace before fetching its reports. Public competitor-ad and PageSpeed requests do not require a workspace; Adzviser authentication and access requirements still apply.

## Skill discovery

Users can ask in ordinary language or select Adzviser in the slash-command picker. Terminal names include `/adzviser:adzviser` and `/adzviser:setup`; Desktop versions may expose `/adzviser` and `/setup` with **(adzviser)** in the description. The starting skill is new in 1.1.0; older installations have only the setup entry. Use the name actually offered by the host. If no Adzviser skills are available, check plugin enablement and scope separately from account sign-in. Use an ordinary working folder for a Local Code session, not the `.claude` configuration directory.
