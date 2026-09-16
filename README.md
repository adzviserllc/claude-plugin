# Adzviser for Claude

Turn connected marketing data into performance reviews, pacing checks, SEO insights, and ecommerce reports. The plugin includes eight skills, a marketing analyst agent, and its own Adzviser sign-in. You do not need to install or enable the Adzviser directory connector.

**Release candidate: 1.1.0-rc.2.** The GitHub marketplace now offers one plugin: **Adzviser**. It includes the local connection previously tested as Adzviser desktop. Real sign-in and workspace access worked in one Linux Desktop installation; the consolidated package still needs the interactive checks in [testing.md](https://github.com/adzviserllc/claude-plugin/blob/main/docs/testing.md) before directory submission. The latest stable tag remains 1.0.2 and contains the earlier remote connection.

## Get started in Claude Desktop Code

You need an [Adzviser account](https://adzviser.com/set-up), a local Code session, and Node.js **22.12+** with npm available to Claude Desktop. Your organization must permit local MCP servers. Cowork, Chat, remote Code sessions, macOS, and Windows have not been verified for this candidate.

1. In **Customize → Plugins**, add the marketplace repository `https://github.com/adzviserllc/claude-plugin`. Install **Adzviser**, version **1.1.0-rc.2**. If the marketplace is already added, refresh it and update Adzviser.
2. Start a new **local Code** conversation in an ordinary working folder, not `.claude`. Claude may ask you to approve the plugin's local connection. Complete the Adzviser browser sign-in when it opens.
3. Close the confirmation tab using your browser and return to Claude Desktop. Ask:

```text
Use Adzviser to show my connected accounts and suggest a useful first report.
```

You can keep the directory connector disabled. The plugin uses your existing Adzviser account and workspaces through its own connection. For a known reporting task, simply ask the question; a separate setup command is not required.

### Upgrading from the Desktop test plugin

If you installed **Adzviser desktop** (`adzviser-desktop`), remove that old test plugin and install/update **Adzviser** from the refreshed marketplace. The catalog no longer offers two editions. An already installed test copy can remain in Yours until removed.

The new plugin identity has its own saved-login location, so expect to sign in once when moving from the test plugin. We do not copy credentials from the test plugin or directory connector. Future updates keep the same Adzviser identity. Restart Desktop after updating to load the new package.

## Claude Code in a terminal

Enter these commands inside Claude Code, not in your normal shell:

```text
/plugin marketplace add adzviserllc/claude-plugin
/plugin install adzviser@adzviser
```

Use user scope to make the plugin available across projects, or project scope for one project. The same package starts its local helper and opens browser sign-in when needed. Use `/mcp` to inspect the Adzviser connection if it fails to start.

## If something gets stuck

| What you see | Next step |
| --- | --- |
| Skills appear but data tools are missing | Check the plugin's Adzviser server status in Claude's MCP controls (`/mcp` where available). Do not keep reinstalling. |
| `npx` cannot be found | Make Node.js 22.12+ and npm available to Claude Desktop, then restart it. |
| Sign-in timed out | Finish browser sign-in, then reconnect the server or start a new local conversation and retry the question. |
| Your workspace appears but a source is missing | Add the source account in [Adzviser setup](https://adzviser.com/set-up). |
| No `/adzviser` command | Ask in ordinary language or select the Adzviser setup skill. Labels vary by host; also check installation scope and enablement. |
| Connected status but tools still missing | Share the visible status/error with [support](https://adzviser.com/contact-us), without credentials or raw authentication logs. |

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

The plugin declares one local MCP server named **adzviser**. Its Node.js launcher runs the pinned `mcp-remote@0.14.2` helper, which connects to `https://mcp.adzviser.com/http` using browser OAuth with PKCE. The helper is downloaded from npm on first use with installation scripts disabled. The top-level version is pinned; npm resolves its dependency ranges.

Claude shows a permission prompt because this helper runs locally with your user account's OS permissions. Renaming the server does not narrow those permissions. The helper handles MCP messages, reporting results, and its own OAuth files. The plugin does not add a filesystem-browsing MCP tool or installation hook. The skills may use Claude's file and calculation tools for requested analysis and exports.

The helper stores its authorization under `${CLAUDE_PLUGIN_DATA}/auth`, separately from the directory connector. Claude determines that directory; it can vary by installation method. Credential files have owner-only permissions on Unix. Do not share them. The local callback page contains no external resources and clears the authorization parameters from the address bar. A successful tool call confirms actual account access.

The plugin adds no Adzviser-specific telemetry. The hosted service is covered by [Adzviser's privacy policy](https://docs.adzviser.com/privacy) and [terms](https://docs.adzviser.com/terms). It retrieves reports and recommends actions; it does not change campaigns or schedule recurring jobs.

## Development and publishing

There is one package at the repository root. Edit `skills/`, `agents/`, and `runtime/` directly. The marketplace has one entry pointing at that package. Bump `.claude-plugin/plugin.json` for each release.

```bash
claude plugin validate .claude-plugin/plugin.json --strict
claude plugin validate .claude-plugin/marketplace.json --strict
claude plugin validate skills --strict
claude plugin validate agents --strict
node --test scripts/callback-page.test.cjs
python3 scripts/test_desktop_connection.py
python3 scripts/package_plugin.py
```

The synthetic integration test exercises OAuth, workspace retrieval, saved-login reuse, and refresh without customer credentials. The ZIP includes only distributable plugin files. Follow [release checks](https://github.com/adzviserllc/claude-plugin/blob/main/docs/testing.md) and [submission instructions](https://github.com/adzviserllc/claude-plugin/blob/main/SUBMISSION.md) before submitting to Anthropic. Adding our GitHub marketplace does not publish the plugin in Anthropic's directory.

No backend deployment or `mcp/deploy.sh` run is needed for this package update. Earlier editions remain in Git history and existing tags.

## Support and license

[Account setup](https://adzviser.com/set-up) · [Troubleshooting](https://docs.adzviser.com/troubleshoot) · [Contact](https://adzviser.com/contact-us)

Plugin source: [Apache License 2.0](LICENSE). The Adzviser service is governed by its own terms.
