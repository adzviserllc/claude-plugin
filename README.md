# Adzviser for Claude

Turn connected marketing data into performance reviews, pacing checks, SEO insights, and ecommerce reports. This plugin bundles seven skills and a marketing analyst agent with [Adzviser's](https://adzviser.com) remote MCP connection.

## Install

### Claude Code in a terminal

Run these commands inside Claude Code:

```text
/plugin marketplace add adzviserllc/claude-plugin
/plugin install adzviser@adzviser
```

Restart your session if prompted. Open `/mcp`, select Adzviser, and complete browser sign-in. Then try `/adzviser:setup`.

### Claude and Cowork

Open **Customize → Plugins**, choose **Add marketplace**, and add this repository:

```text
https://github.com/adzviserllc/claude-plugin
```

Install Adzviser and complete the connection's OAuth sign-in. Alternatively, download `adzviser-1.0.1.zip` from [Releases](https://github.com/adzviserllc/claude-plugin/releases) and use the custom-plugin upload option. Available controls depend on your Claude plan and organization settings. See [Claude's installation guide](https://support.claude.com/en/articles/13837440-use-plugins-in-claude).

### Code tab in Claude Desktop

Install through **Customize → Plugins**, then start a new **Local** Code session. Type `/adzviser` in the prompt or open **+ → Plugins** to check that the skills are available in that session. Select `/adzviser:setup` to test the skill directly.

Manage the data connection through **+ beside the prompt → Connectors → Manage connectors**. Installing a plugin does not prove its connection is authenticated. A missing tool, a disabled connector, and an authentication error need different fixes; inspect the actual status. See [Claude Desktop's controls](https://code.claude.com/docs/en/desktop#connect-external-tools).

## Requirements

- An Adzviser account with access to the requested data sources. See [current plans](https://adzviser.com/pricing).
- A [workspace](https://docs.adzviser.com/getStarted/workspace) containing the accounts you want to analyze. Create and manage connections at [Adzviser setup](https://adzviser.com/set-up).
- A Claude environment that supports plugins and remote MCP connections. Use an up-to-date Claude Code release for plugin skills.

Public competitor-ad and PageSpeed requests do not require a workspace, but still require Adzviser authentication and applicable access. You do not need to paste an API key into this plugin.

## Included workflows

Type a command or ask a matching question in ordinary language. In Claude Code the commands use the `adzviser:` namespace.

| Skill | Example |
| --- | --- |
| `/adzviser:setup` | “Which workspaces and source accounts are connected?” |
| `/adzviser:reporting` | “Export last month's Google Ads spend by campaign.” |
| `/adzviser:performance-review` | “Compare Google Ads and Meta Ads last week with the week before.” |
| `/adzviser:budget-pacing` | “Are we on pace for our USD 20,000 advertising budget this month?” |
| `/adzviser:seo-review` | “Which organic landing pages lost clicks over the last 28 days?” |
| `/adzviser:ecommerce-review` | “Compare Shopify revenue with ad spend last month.” |
| `/adzviser:competitor-research` | “Compare public Meta ads from these two competitors in the United States.” |

The **marketing-analyst** agent supports more involved multi-source analyses in hosts that support plugin agents. The skills also work without delegating to the agent.

## How it works

An MCP connector supplies tools and data access. A plugin packages that connection with instructions for completing useful work. This package uses the existing Adzviser service at `https://mcp.adzviser.com/http`; it does not deploy another server.

The reporting skills discover your workspace and valid fields, resolve dates, retrieve model-visible rows, and calculate results while preserving currency, reporting grain, and attribution differences. Supported sources depend on your connected accounts and the live MCP catalog; examples include Google Ads, Meta Ads, Microsoft Ads, TikTok Ads, LinkedIn Ads, GA4, Search Console, Shopify, WooCommerce, Klaviyo, Amazon, HubSpot, and Salesforce.

The plugin reads reports and recommends next steps. It does not create campaigns, change bids or budgets, or schedule recurring jobs. Public ad research does not expose competitors' private spend or conversions.

## Data and permissions

The bundle contains Markdown instructions, JSON configuration, and the Adzviser icon. It has no installation hooks, bundled executable server, or plugin-side telemetry. Claude connects to Adzviser through OAuth and uses Adzviser's service to retrieve requested source data. The hosted service's handling of data is covered by the [Adzviser privacy policy](https://docs.adzviser.com/privacy) and [terms](https://docs.adzviser.com/terms).

The skills may use Claude's local calculation or file tools to analyze rows and create requested exports. They do not require broad file scans, credentials in chat, or public sharing of account reports. Follow your organization's data-access rules.

## Development and publishing

This repository is a self-contained plugin and marketplace. Skills live at the root-level `skills/` directory; manifests live in `.claude-plugin/`. Each skill supplies its own slash command, so there is no duplicate `commands/` directory.

Validate both manifests explicitly, then load the plugin:

```bash
claude plugin validate .claude-plugin/plugin.json --strict
claude plugin validate .claude-plugin/marketplace.json --strict
claude plugin validate skills --strict
claude plugin validate agents --strict
claude --plugin-dir .
```

Build the uploadable ZIP with Python 3:

```bash
python3 scripts/package_plugin.py
```

The packager includes only plugin runtime files, README, and license. It excludes Git history, development scripts, submission notes, and marketplace metadata. Follow the [smoke checks](https://github.com/adzviserllc/claude-plugin/blob/main/docs/testing.md) before releasing. Bump `version` in `.claude-plugin/plugin.json` for each update; it is the version source of truth.

See [submission instructions and listing copy](https://github.com/adzviserllc/claude-plugin/blob/main/SUBMISSION.md) for the separate Anthropic directory review, and [competitor research](https://github.com/adzviserllc/claude-plugin/blob/main/docs/competitive-research.md) for the design rationale. A repository marketplace is directly installable; an Anthropic directory listing requires their review.

## Support and license

[Setup guide](https://docs.adzviser.com/claude/mcp-integration-guide) · [Troubleshooting](https://docs.adzviser.com/troubleshoot) · [Contact](https://adzviser.com/contact-us)

Plugin source: [Apache License 2.0](LICENSE), consistent with Adzviser's existing Claude skill. The Adzviser service is governed by its own terms.
