# Adzviser Desktop — independent connection experiment

This test edition packages the eight Adzviser workflows with its **own data connection and browser sign-in**. The Adzviser directory connector can stay disabled. It still uses your existing Adzviser account and the hosted Adzviser service.

**Status: experimental, not ready for a directory submission.** Automated checks do not establish that a fresh customer's Desktop installation completes sign-in successfully. Test the steps below before making that claim.

## Install and test in Claude Desktop Code

Requires a **local** Code session, Node.js **22.12 or newer** and npm available to the Desktop app, permission to run local MCP servers, and access to npm and `mcp.adzviser.com`. The first start downloads `mcp-remote@0.14.2` through npm with installation scripts disabled. This edition has not been verified in Cowork, Chat, remote Code sessions, or Windows.

1. In **Customize → Plugins**, refresh the marketplace from `https://github.com/adzviserllc/claude-plugin`. Install **adzviser-desktop**, version **0.1.0-rc.1**, in an ordinary working folder. If the original **adzviser** plugin is installed, turn it off for this test to avoid duplicate skill names. Keep the directory connector disabled during this independence test.
2. Start a new **local Code** conversation in that same folder. Approve the plugin's local MCP connection if Claude asks. The helper should open Adzviser's browser sign-in. Complete it; this is a new authorization for **Adzviser-Desktop-Plugin**, separate from the directory connector.
3. Ask: **“Use Adzviser Desktop's independent connection to list my actual workspaces and connected data sources.”** Check that an actual `list_workspace` call uses `plugin:adzviser-desktop:adzviser-independent` (punctuation may differ in tool names), and compare its result to your Adzviser account.
4. Start another conversation in the same folder, with the directory connector still disabled. Repeat the request. Passing this check establishes both independent access and reuse of the saved login for your installation.
5. Run one small report for a known account and date range and compare the totals to the source platform before approving this edition for customers.

If the browser does not open, inspect the independent server's visible status in Claude's MCP controls (`/mcp` where available). `npx` not found means Desktop cannot see your Node/npm installation. If sign-in outlasts Claude's startup timeout, reconnect the server after signing in. Do not keep reinstalling the plugin or paste credentials into chat.

Terminal Claude Code can install the same edition with `/plugin install adzviser-desktop@adzviser`, after adding this repository marketplace. These slash commands are entered in Claude Code, not a normal shell. User-scoped installation makes it available across projects; project-scoped installation applies only to that project.

## How it stays separate

The plugin declares a local stdio server named **adzviser-independent**. The pinned [mcp-remote helper](https://github.com/punkpeye/mcp-remote) connects directly to `https://mcp.adzviser.com/http` using browser OAuth with PKCE. It does not read Claude's directory-connector login or require that connector to be enabled. See [Claude's plugin MCP documentation](https://code.claude.com/docs/en/mcp#plugin-provided-mcp-servers).

Authorization is stored under `${CLAUDE_PLUGIN_DATA}/auth`, normally `~/.claude/plugins/data/adzviser-desktop-adzviser/auth`, separately from the directory connector and other `mcp-remote` installations. The helper writes credential files with owner-only permissions on Unix. Claude manages the plugin data directory across updates and uninstall; do not put it in your project or share its contents. Removing local saved credentials does not revoke server-side access; account-level revocation remains separate.

This experiment is for the observed Desktop behavior where a remote plugin connection was replaced by an empty placeholder. It uses a supported local MCP transport. It does not alter Desktop, bypass organization policy, or establish that all Desktop versions require this workaround.

No backend deployment or `mcp/deploy.sh` run is needed. The original remote-connection edition remains available as **adzviser**. To revert, disable this experimental edition and use the original plugin with your existing connection.

## Data and maintenance

The local helper processes MCP requests, tool results, and its own OAuth credentials. It is third-party executable code, downloaded from npm; its top-level version is pinned, while npm resolves its dependency ranges. It has no Adzviser-specific telemetry added by this plugin. The hosted service remains covered by [Adzviser's privacy policy](https://docs.adzviser.com/privacy) and [terms](https://docs.adzviser.com/terms).

The workflow files in this directory are generated from the repository's shared skills by `scripts/build_desktop.py`, with independent connection guidance. Edit the shared skills or `templates/desktop/`, then regenerate. Do not edit generated copies directly.
