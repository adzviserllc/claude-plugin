# Adzviser for Claude

Turn connected marketing data into performance reviews, pacing checks, SEO insights, and ecommerce reports. One plugin includes eight skills, a marketing analyst agent, and connections to your Adzviser data.

**Version 1.2.1 — Cowork connection preview.** The local helper now waits for an explicit connection request instead of opening a second sign-in when Cowork starts. The plugin includes a remote HTTP connection and a local Claude Code connection. Cowork installation and the remote connector's Connected state have been observed; live Cowork reporting and sign-in reuse still require acceptance testing. See [test evidence](https://github.com/adzviserllc/claude-plugin/blob/main/docs/independent-connection-testing.md).

## Try it in Cowork

1. Add or refresh the GitHub marketplace `https://github.com/adzviserllc/claude-plugin` in Claude's plugin controls. Install or update the single **Adzviser** plugin and confirm version **1.2.1**. Refresh controls vary by host; if GitHub automatic sync is unavailable, use the marketplace's manual refresh/update option.
2. Open the plugin's connection setup and complete the **Connect / Sign in** action for its remote Adzviser connection. The configuration calls this route `cloud`; Claude may show **Adzviser** after matching its URL to a directory entry. If Claude opens **Customize → Connectors → Adzviser**, complete authorization there. You should not need to find and install another plugin or enter an MCP URL manually.
3. In a new Cowork conversation, select the Adzviser setup skill or ask:

```text
Use Adzviser to list my actual workspaces and their connected data sources.
```

A live `list_workspace` result establishes access. A plugin toggle, a connection listed in its manifest, or workspace names recalled from memory do not. Then try a small report and repeat the workspace request in another conversation without signing in again. See the [Cowork acceptance checklist](https://github.com/adzviserllc/claude-plugin/blob/main/docs/testing.md#cowork-acceptance).

Claude manages the remote connection and its authorization. It may reuse or enable the existing Adzviser directory entry for the same URL. The plugin cannot require that entry to remain disabled or guarantee separate remote credentials. The intended flow is one plugin installation followed by the connection step Claude presents. If no remote connection is provisioned, report that outcome; do not keep reinstalling.

Remote access uses the existing public Adzviser service and needs no local Node.js installation. The exact Cowork UI and whether it provisions the bundled connection are still being tested. Chat, web, mobile, and remote Code compatibility must each be verified before advertising support.

## Local Claude Code

The local connection remains **analytics** (`plugin:adzviser:analytics`). Its OAuth client configuration and saved-login directory are unchanged. Version 1.2.1 starts that connection on demand. Earlier versions' workspace and reporting workflows have been tested in Linux Desktop Code, and setup has been tested in the Linux terminal. Node.js **22.12+** and npm must be available, and the organization must permit local MCP servers.

In Desktop Code, install/update Adzviser through the GitHub marketplace and open an ordinary working folder. In a terminal, enter these commands inside Claude Code:

```text
/plugin marketplace add adzviserllc/claude-plugin
/plugin install adzviser@adzviser
```

Choose user scope for availability across projects, or project scope for one project. Ask Adzviser for your workspaces or a report. The setup guidance tells Claude to start local access using `adzviser_connect` when needed. The helper reuses saved authorization or opens browser sign-in, then announces data tools in the same conversation. Before this step, `/mcp` can show the local server connected with only its status and connection tools; data access is still idle.

The package now declares two connection routes, so `/mcp` can list **analytics** and **cloud**. You only need one working route. A `cloud` entry waiting for authentication does not block the local `analytics` connection. You do not need to sign into both. The directory connector can remain disconnected when testing local Code.

After updating, restart Claude Code or fully quit and reopen Claude Desktop to load the new package. On the tested Linux installation, **Ctrl+Q** quits Desktop; closing its window can leave it running in the tray. Skill commands stay the same. If an old **Adzviser desktop** test plugin remains installed, it is a historical edition; the marketplace offers one current Adzviser plugin.

## If something gets stuck

| What you see | Next step |
| --- | --- |
| Cowork has skills but no data tools | Complete the plugin's remote connection step. If no remote connection was provisioned, report that gap with the visible status. |
| Cowork opens Customize → Connectors → Adzviser | This may be Claude's URL-matched connection for the plugin. Complete its supported sign-in action. |
| Cowork has no local status tool or localhost browser page | Those belong to the local Code helper. Use the remote connection's status and authorization controls. |
| Cowork shows Adzviser Connected and analytics Runs in each session | Use the remote Adzviser data tools. Leave the local connection idle; another local sign-in is not required. |
| Version 1.2.0 opens a second browser sign-in in Cowork | Update to 1.2.1 and start a new session. The local helper no longer starts OAuth automatically. Keep the remote authorization. |
| Local Code has only status and connection tools | Ask Adzviser for your workspaces; the setup skill calls `adzviser_connect` and reuses the saved login. |
| Local Code shows `cloud` needs authentication, while `analytics` works | Continue using `analytics`; another sign-in is not required. |
| Local Code cannot find `npx` | Make Node.js 22.12+ and npm available to the app, then restart it. |
| Local connection says sign-in is pending | Finish its browser sign-in and tell Claude you are back. Do not reinstall or repeatedly poll. |
| Local connection reports a failure | Reconnect `analytics` through `/mcp`. Its browser sign-in deadline is five minutes. |
| Both routes are connected | Use one consistently; avoid duplicate requests. Different signed-in accounts may expose different workspaces. |
| A workspace appears but a source is missing | Add the source account in [Adzviser setup](https://adzviser.com/set-up). |
| Connected status but tools still missing | Share the visible non-secret status/error with [support](https://adzviser.com/contact-us). |

Public competitor-ad and PageSpeed requests do not require a workspace, but still require authentication and applicable account access. Never paste passwords, codes, or tokens into a conversation.

## Included workflows


Ask a matching question in ordinary language, or select a skill from the command picker. The table uses terminal command names; Desktop may display the shorter skill name with **(adzviser)** in its description.

| Skill | Example |
| --- | --- |
| `/adzviser:adzviser` | “Get started with Adzviser.” Or enter your reporting question directly. |
| `/adzviser:setup` | “Which workspaces and source accounts are connected?” |
| `/adzviser:reporting` | “Export last month's Google Ads spend by campaign.” |
| `/adzviser:performance-review` | “Compare Google Ads and Meta Ads last week with the week before.” |
| `/adzviser:budget-pacing` | “Are we on pace for our USD 20,000 advertising budget this month?” |
| `/adzviser:seo-review` | “Which organic landing pages lost clicks over the last 28 days?” |
| `/adzviser:ecommerce-review` | “Compare Shopify revenue with ad spend last month.” |
| `/adzviser:competitor-research` | “Compare public Meta ads from these two competitors in the United States.” |

The **marketing-analyst** agent supports more involved multi-source analyses in hosts that support plugin agents. The skills also work without delegating to the agent.

## Connection and permissions

The root `.mcp.json` contains two standard MCP entries pointing to the same service:

| Route | Transport | Authorization | Intended use |
| --- | --- | --- | --- |
| `cloud` | HTTP to `https://mcp.adzviser.com/http` | Managed by Claude | Cowork and remote hosts; app acceptance pending |
| `analytics` | Local stdio helper | Managed by the helper | Existing local Claude Code workflow |

The remote entry contains no API key, token, custom authorization header, or user environment variable. Claude handles OAuth discovery and authorization. Its connection labels and credential storage are host-controlled; plugin tool prefixes are not guaranteed across hosts. The plugin does not copy credentials between the routes. Remote sign-in may be required even if local Code already has a saved login.

The local helper uses `@modelcontextprotocol/sdk@1.30.0` to initialize immediately and expose `adzviser_connection_status` and `adzviser_connect`. Startup, tool discovery, and status reads do not start OAuth. Calling the connection tool starts `mcp-remote@0.14.2` for OAuth with PKCE and remote reporting. npm downloads the packages on first use with installation scripts disabled. The top-level versions are pinned; their dependency ranges are resolved by npm. The local helper stores authorization under `${CLAUDE_PLUGIN_DATA}/auth`, with owner-only credential-file permissions on Unix. Its callback page has no external resources and clears authorization parameters from the address bar.

Claude may show a local-server permission prompt because the package still includes that helper. The helper runs with the user's OS permissions; the plugin adds no filesystem-browsing MCP tool or installation hook. Skills may use Claude's file and calculation tools for requested analysis and exports. Organization restrictions apply to both connection routes.

The plugin adds no Adzviser-specific telemetry. The hosted service is covered by [Adzviser's privacy policy](https://docs.adzviser.com/privacy) and [terms](https://docs.adzviser.com/terms). It retrieves reports and recommends actions; it does not change campaigns or schedule recurring jobs.

## Development and publishing

There is one root package and one marketplace entry. Edit `skills/`, `agents/`, and `runtime/` directly. Bump `.claude-plugin/plugin.json` for each release.

```bash
claude plugin validate .claude-plugin/plugin.json --strict
claude plugin validate .claude-plugin/marketplace.json --strict
claude plugin validate skills --strict
claude plugin validate agents --strict
node --test scripts/callback-page.test.cjs
python3 scripts/test_desktop_connection.py
python3 scripts/test_remote_connection.py
python3 scripts/test_slow_signin.py
python3 scripts/package_plugin.py
```

Tests use synthetic credentials on loopback services. The HTTP test exercises OAuth discovery, PKCE, reporting, authorization reuse, and refresh without the local helper. The slow-sign-in test uses an isolated real Claude Code engine, a 40-second browser delay, and both routes to verify that the unauthenticated remote entry does not block local tools. Pass `--claude /path/to/claude` to test a specific engine; no model requests are made.

The ZIP includes only distributable files. Follow [release checks](https://github.com/adzviserllc/claude-plugin/blob/main/docs/testing.md) and [submission instructions](https://github.com/adzviserllc/claude-plugin/blob/main/SUBMISSION.md). A GitHub marketplace is separate from an Anthropic directory listing. The Cowork preview must pass its actual app checks before being described as verified support.

The remote entry uses the existing deployed MCP service. No backend deployment or `mcp/deploy.sh` run is needed for this package change.

## Support and license

[Account setup](https://adzviser.com/set-up) · [Troubleshooting](https://docs.adzviser.com/troubleshoot) · [Contact](https://adzviser.com/contact-us)

Plugin source: [Apache License 2.0](LICENSE). The Adzviser service is governed by its own terms.
