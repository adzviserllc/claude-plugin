# Adzviser plugin directory submission

This document contains listing copy and the remaining publication steps. A GitHub repository and its own marketplace do not by themselves constitute an Anthropic directory listing.

The repository's 1.1.0-rc.1 test candidate adds an Adzviser starting skill and shared connection guidance. It is available from `main` but not verified for first-time Desktop onboarding. The latest stable tagged release is 1.0.2. Use that release's listing copy if submitting 1.0.2; the eight-skill copy below describes the candidate.

## Submission values

| Field | Value |
| --- | --- |
| Plugin repository | `https://github.com/adzviserllc/claude-plugin` |
| Plugin path | Repository root (`.`) |
| Plugin ID | `adzviser` |
| Suggested display name | Adzviser Marketing Analytics |
| Publisher | Adzviser |
| Version | `1.1.0-rc.1` (repository test candidate; latest stable tag is `1.0.2`) |
| Categories, if requested | Marketing; Data & Analytics |
| Website | `https://adzviser.com` |
| Documentation | `https://github.com/adzviserllc/claude-plugin#readme` |
| Support | `https://adzviser.com/contact-us` |
| Contact email | `zeyuan.gu@adzviser.com` |
| Privacy policy | `https://docs.adzviser.com/privacy` |
| Service terms | `https://docs.adzviser.com/terms` |
| Source license | Apache-2.0 |
| Icon asset, if requested | `assets/adzviser.png` |
| Remote MCP URL | `https://mcp.adzviser.com/http` |
| Authentication | Browser-based OAuth; no embedded credentials |
| Existing connector listing | `https://claude.ai/directory/adzviser` |
| Target environments | Claude Code and Cowork |

Map these values to the fields actually shown by the form; optional labels and requested assets can change.

## Short description

Analyze marketing data with Adzviser: performance reviews, budget pacing, SEO, ecommerce reporting, and public competitor ad research.

## Full description

Analyze your marketing, analytics, ecommerce, and CRM data through Adzviser. Eight bundled skills include a starting workflow, account discovery, reporting, campaign performance reviews, budget pacing, organic search analysis, ecommerce reporting, and public competitor ad research. Ask a question directly; the workflows check access and provide a connection step when needed.

Adzviser connects through OAuth and uses your existing workspaces and source permissions. Reporting workflows discover available fields, calculate exact date ranges, and preserve currency and attribution differences when comparing results. The included marketing analyst agent supports more involved analysis in compatible Claude environments.

This plugin provides reporting and recommendations. It does not create campaigns or change advertising budgets. Public ad-library research covers public creative and messaging, not competitors' private performance data. An Adzviser account and access to the requested sources are required.

In the tested Claude Desktop Code configuration, Adzviser must also be connected and enabled through Desktop's Connectors controls. Automatic connection setup from a plugin-only installation has not been verified. Do not advertise one-click onboarding or suggest that directory approval resolves this automatically.

## Reviewer setup and sample prompts

1. Install from this public repository or the release ZIP.
2. Authenticate to Adzviser through the host's OAuth controls. In terminal Claude Code, use `/mcp`. In the Code tab of Claude Desktop, enable Adzviser under **+ beside the prompt → Connectors** and use **Manage connectors** for account connection or sign-in. Keep the directory connector enabled; it can share the plugin's tool connection. In a Local session, confirm the setup skill is available as `/adzviser:setup` or `/setup` with an Adzviser description, depending on the host.
3. Use a designated Adzviser review account with a reporting workspace connected to the sources being tested. Account setup starts at `https://adzviser.com/set-up`. If Anthropic requests provisioned access, supply it through their private reviewer-access mechanism, never in this public repository.
4. Select the Adzviser setup skill, verify real workspaces, then test representative prompts:
   - “How much did Google Ads spend last month?”
   - “Compare Google Ads and Meta performance last week with the previous week.”
   - “Check month-to-date pacing against a USD 20,000 budget.”
   - “Compare Shopify revenue with our ad spend last month.”
   - “Find public Meta ads for this advertiser in the United States.”

## Submit and track review

After manifest validation and the account/Cowork smoke checks in [testing.md](docs/testing.md), open the [Claude.ai submission form](https://claude.ai/admin-settings/directory/submissions/plugins/new). The [Console form](https://platform.claude.com/plugins/submit) is an alternative.

Submit the public repository URL and use the listing copy above where requested. Track the result at [Directory submissions](https://claude.ai/admin-settings/directory/submissions). Claude.ai requires a Team or Enterprise organization with directory management access; Console requires an appropriate organization role. Review timing is controlled by Anthropic. See [their submission guide](https://claude.com/docs/plugins/submit).

Current Claude Code documentation routes third-party submissions to the community marketplace and treats the official marketplace as separately curated. Confirm the actual approved catalog before advertising an installation command for it. See [the publication guide](https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace).

Our own marketplace is independently installable using `/plugin marketplace add adzviserllc/claude-plugin`, then `/plugin install adzviser@adzviser`.

## Future releases

Maintain the public repository as the stable distribution source. Update the plugin version, rerun validation and smoke checks, and attach the new ZIP/checksum to a GitHub release. Anthropic's submission documentation says updates to an approved source are picked up automatically and screened; continue monitoring the directory status after publishing changes.
