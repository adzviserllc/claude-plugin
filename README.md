# Adzviser for Claude

Turn connected marketing data into performance reviews, pacing checks, SEO insights, and ecommerce reports. Start with a question; Adzviser checks access and guides you into the relevant workflow. The plugin includes eight skills and a marketing analyst agent.

> The repository's `main` branch contains test candidate **1.1.0-rc.1**. The new starting skill and connection guidance have not yet passed an interactive Desktop onboarding test. The latest stable tagged release remains **1.0.2**.

**Testing an independent Desktop connection?** The marketplace also contains experimental **adzviser-desktop 0.1.0-rc.3**, with a branded sign-in confirmation page. It uses a local helper with its own browser sign-in, allowing the directory connector to remain disabled. Requires Node.js 22.12+ and npm. Follow the [separate installation and test guide](https://github.com/adzviserllc/claude-plugin/blob/main/desktop/README.md); the instructions below describe the original remote edition.

## Get started in Claude Desktop

You need an [Adzviser account](https://adzviser.com/set-up) with the source accounts you want to analyze. If you already connected Adzviser to Claude, keep that connection enabled and reuse it.

1. In **Customize → Plugins**, choose **Add marketplace → Add from a repository**, enter `https://github.com/adzviserllc/claude-plugin`, and install Adzviser. The repository currently provides **1.1.0-rc.1**. If the marketplace is already added, refresh it and update the installed plugin using the available controls. Confirm the displayed version is **1.1.0-rc.1** before testing; an existing installation may still be on an older version.
2. Start a conversation and ask:

```text
Use Adzviser to show my connected accounts and suggest a useful first report.
```

If your data is already accessible, the workflow should proceed without another login. Otherwise, it gives you the relevant connection step. In the **Code tab**, open **+ beside the prompt → Connectors** and enable Adzviser. Use **Manage connectors** for sign-in. If Adzviser is absent, open [Connect Adzviser](https://claude.ai/directory/adzviser) using the same Claude account and organization, complete browser authorization, then return to the conversation. In **Cowork**, use **Customize → Connectors**. Reply **done** in the same conversation to continue the pending request.

For a Code session, choose a normal working folder, not `.claude`. If you prefer a command, select the **Adzviser** starting skill from the slash-command picker: Desktop may display `/adzviser`, while terminal Claude Code uses `/adzviser:adzviser`. The existing setup skill remains available as `/setup` or `/adzviser:setup`. The starting skill is included in this candidate; version 1.0.2 has the setup skill only.

**Current Desktop limitation:** installing our GitHub plugin has not been shown to automatically establish its data connection. Our successful Desktop test used the plugin with an enabled Adzviser connector. This candidate improves guidance and task continuation; it does not remove that connection step or implement an automatic sign-in window. See [Desktop's connection controls](https://code.claude.com/docs/en/desktop#connect-external-tools) and [Claude's plugin installation guide](https://support.claude.com/en/articles/13837440-use-plugins-in-claude).

## Claude Code in a terminal

Run these commands inside terminal Claude Code, not in a normal shell or Desktop chat:

```text
/plugin marketplace add adzviserllc/claude-plugin
/plugin install adzviser@adzviser
```

Restart your session if prompted, then ask the same getting-started question above. If sign-in is needed, open `/mcp`, select Adzviser, and complete browser authorization. This uses the plugin's declared connection. An isolated terminal check reached the sign-in requirement; a first-time authenticated terminal report still needs verification.

## If something gets stuck

| What you see | Next step |
| --- | --- |
| An Adzviser skill appears, but it cannot access data | Check Adzviser under Connectors in Desktop. The skill loaded; repeated plugin installation is not the first fix. |
| Adzviser is connected and enabled, but tools remain unavailable | Share the visible status/error with [support](https://adzviser.com/contact-us). Do not keep reinstalling or signing in. |
| Your workspace appears, but a requested source is missing | Add that account in [Adzviser setup](https://adzviser.com/set-up); the Claude connection is already working. |
| `/adzviser` is unavailable | Ask in ordinary language or use the Adzviser setup entry. Command labels depend on your host and installed version. |

Connection authorization always happens through the browser or Claude's own controls. Never paste a password or access token into the conversation.

## Requirements

- An Adzviser account with access to the requested data sources. See [current plans](https://adzviser.com/pricing).
- A [workspace](https://docs.adzviser.com/getStarted/workspace) containing the accounts you want to analyze. Create and manage connections at [Adzviser setup](https://adzviser.com/set-up).
- A Claude environment that supports plugins and remote MCP connections. Use an up-to-date Claude Code release for plugin skills.

Public competitor-ad and PageSpeed requests do not require a workspace, but still require Adzviser authentication and applicable access. You do not need to paste an API key into this plugin.

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

## How it works

An MCP connector supplies tools and data access. A plugin packages that connection with instructions for completing useful work. This package uses the existing Adzviser service at `https://mcp.adzviser.com/http`; it does not deploy another server. Claude can share one set of tools between a plugin and a directory connector pointing at the same server. See [Anthropic's explanation of how they coexist](https://claude.com/docs/connectors/building/what-to-build#how-they-coexist).

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

For the experimental Desktop edition, run `python3 scripts/build_desktop.py`, then `python3 scripts/package_plugin.py --edition desktop`. CI checks that generated workflow copies match their sources and exercises OAuth, tool calls, and saved-login reuse against a local fixture with synthetic credentials.

The packager includes only plugin runtime files, README, and license. It excludes Git history, development scripts, submission notes, and marketplace metadata. Follow the [smoke checks](https://github.com/adzviserllc/claude-plugin/blob/main/docs/testing.md) before releasing. Bump `version` in `.claude-plugin/plugin.json` for each update; it is the version source of truth.

See [submission instructions and listing copy](https://github.com/adzviserllc/claude-plugin/blob/main/SUBMISSION.md) for the separate Anthropic directory review, and [competitor research](https://github.com/adzviserllc/claude-plugin/blob/main/docs/competitive-research.md) for the design rationale. A repository marketplace is directly installable; an Anthropic directory listing requires their review.

## Support and license

[Setup guide](https://docs.adzviser.com/claude/mcp-integration-guide) · [Troubleshooting](https://docs.adzviser.com/troubleshoot) · [Contact](https://adzviser.com/contact-us)

Plugin source: [Apache License 2.0](LICENSE), consistent with Adzviser's existing Claude skill. The Adzviser service is governed by its own terms.
