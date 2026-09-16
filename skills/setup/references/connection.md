# Check Adzviser access and continue the task

Run this check when an Adzviser workflow starts or encounters a connection problem. This is guidance for the assistant, not a technical checklist to show the user.

## Check only what the task needs

1. Preserve the user's goal, requested sources, dates, workspace, and output in the current conversation. Resolve relative dates before a connection pause and retain those dates when resuming. Do not save credentials or create a project file for this purpose.
2. Discover the required Adzviser tools using the host's tool search if available. Search by service and function name, not a fixed prefix. Desktop can supply the same service through a connector; the terminal can name it `plugin:adzviser:adzviser`.
3. For connected-account reporting or setup, call `list_workspace` unless a successful, current result already covers the scope. Select the sole matching workspace; ask only if the requested client is ambiguous. For public ad-library or PageSpeed requests, discover and call the tools needed for that task without requiring a workspace or a connected advertising account.
4. If access works, continue the requested work immediately. Do not announce a technical preflight, ask the user to connect again, or ask them to invoke a second skill. Tool names appearing in discovery alone do not prove account access.

## When access is blocked

Give a short explanation and one relevant next action. Keep MCP prefixes, transport names, OAuth terminology, and architecture out of ordinary onboarding. Use them only when the user asks for diagnostics.

| Evidence | Response |
| --- | --- |
| Required tools are absent | Say that Adzviser data access is unavailable in this conversation. Use the host-specific connection step below. Do not claim credentials expired or a connection dropped. |
| Host or tool explicitly says sign-in is required | Direct the user to the host's browser sign-in flow. Do not ask for passwords, API keys, or tokens in chat. |
| Access is denied by account permissions, plan, or organization policy | Explain the returned restriction and its applicable account/admin action. Reinstalling or repeated sign-in does not resolve an established permission restriction. |
| Workspace lookup succeeds but the requested workspace/source is absent | Say which source is missing and link to [Adzviser account setup](https://adzviser.com/set-up). Do not ask them to reconnect Claude or substitute another client. |
| A timeout, network error, or server failure occurs | Report a temporary access failure. Retry only when the error or host makes it appropriate; do not prescribe sign-in as a network fix. |

Missing tools do not distinguish disabled access, missing authorization, and a Desktop loading issue. Do not claim to have diagnosed one without evidence. An available Adzviser skill already establishes that at least that part of the plugin loaded; do not tell the user to reinstall it as the first connection fix.

## Choose the right connection step

Use known host context. "Claude Code" alone does not distinguish Desktop's Code tab from the terminal. If unknown, ask just which of those they use, then give that host's step. Do not send a list of instructions for every environment.

- **Code tab in Claude Desktop:** direct the user to **+ beside the prompt → Connectors → Adzviser** to enable access for this conversation. If Adzviser is already listed, use that connection; **Manage connectors** provides account/sign-in controls. If it is absent, link to [Connect Adzviser](https://claude.ai/directory/adzviser), using the same Claude account and organization as Desktop. The link opens the connector listing; it does not silently install or authorize anything. The [Adzviser connection guide](https://docs.adzviser.com/claude/mcp-integration-guide) covers browser sign-in. Return to the conversation and enable access if needed.
- **Cowork or Chat:** direct the user to **Customize → Connectors → Adzviser** and its connection controls. If absent, use the same Connect Adzviser link. Plugin availability and controls depend on the host and organization.
- **Claude Code in a terminal:** direct the user to `/mcp`, select the plugin's Adzviser server, and complete browser sign-in if required. If the server is absent, collect the actual status and check plugin loading/configuration; do not send them to authenticate a nonexistent entry.

The plugin declares `https://mcp.adzviser.com/http`. Desktop can manage remote connections itself; the plugin cannot force its login dialog or enable a disabled connection. Never promise that installation automatically starts sign-in. Keep an existing Adzviser connection enabled, and do not create a duplicate or disable it to test the skills. Do not launch a shell-based OAuth client, manually construct authorization URLs, or copy browser/CLI tokens to work around the host's connection controls.

Example for a missing-tool case in Desktop, adapted to the pending task:

> I can run the weekly review once Adzviser data access is enabled. Open **+ → Connectors** beside the prompt and enable **Adzviser**. If it isn't listed, use [Connect Adzviser](https://claude.ai/directory/adzviser) to sign in. Reply "done" here and I'll continue the review.

## Resume or stop the loop

After the user reports completing the step, rediscover tools and retry the required read once. Proceed with the original request when it succeeds, reusing the established dates and scope. Do not ask them to re-enter the report request. Do not imply that clicking a link resumes work in the background or that the plugin stores the pending task across new conversations.

If tools are still absent after the user confirms connected/enabled status, stop repeating installation or login instructions. Explain the mismatch: the workflow is loaded, but Desktop has not exposed its data tools. Ask for the non-secret connection status/error and use [Adzviser support](https://adzviser.com/contact-us). Never request access tokens, full configuration files, or raw authentication logs. A fresh-session check may help distinguish session loading from connection setup, but do not promise it will fix the problem.
