# Plugin research — 2026-09-14

## What the competitors published

| Package | Public repository contents inspected | Product emphasis |
| --- | --- | --- |
| [Windsor.ai](https://github.com/windsor-ai/claude-windsor-ai-plugin) | Plugin manifest, marketplace manifest, remote MCP configuration, one business-data skill, three commands, one analyst agent | Discover connected sources and fields, query business data, and use it in reports and code. |
| [Adspirer](https://github.com/amekala/adspirer-mcp-plugin) | Plugin and marketplace manifests, HTTP MCP configuration, 15 skills, five commands, one agent, supporting references | Paid-media management, platform-specific workflows, performance analysis, and campaign changes. |

These are public repository snapshots, not claims about the exact revision currently installed from Anthropic's catalog. Adspirer describes its plugin repository as a stable publication source synced from its main development repository. The screenshots supplied for this project show 1,773 Windsor.ai installs and 2,950 Adspirer installs; those are screenshot values, not verified current totals.

## Applied to Adzviser

- One public plugin repository packages the existing hosted MCP endpoint with related workflows. It can also act as an independently installable marketplace.
- Seven focused skills cover setup, ad hoc reporting, performance reviews, pacing, SEO, ecommerce, and public competitor research. A marketing analyst agent can use those same references for larger questions.
- Use the source and field discovery tools actually exposed by Adzviser. Do not reuse competitors' API schemas or campaign-write capabilities.
- Keep the common reporting contract in one reference and metric aggregation rules in another. Resolve current dates at runtime and handle account ambiguity, partial data, mixed currencies, and attribution explicitly.
- Use modern skill commands without duplicating them under `commands/`. Claude's [skills documentation](https://code.claude.com/docs/en/skills) recommends skills for new commands.

The instructions were written for Adzviser's implementation. Competitors' package structure informed the design; their skill text is not bundled.

## Distribution distinction

The existing MCP listing and a plugin listing are separate. [Claude's plugin submission documentation](https://claude.com/docs/plugins/submit) requires a public GitHub repository and describes the authenticated submission forms. Hosting our marketplace enables direct installation; directory inclusion remains subject to review.

The current [Claude Code plugin guide](https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace) distinguishes community submissions from the separately curated official marketplace. The Claude.ai submission guide still uses different marketplace wording. Use the catalog and install identifier supplied after approval rather than promising an `@claude-plugins-official` listing.
