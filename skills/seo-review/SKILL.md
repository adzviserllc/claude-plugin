---
name: seo-review
description: Analyze organic search performance and landing-page opportunities with Adzviser using Google Search Console, GA4, and optional current PageSpeed measurements. Use for SEO reviews, query or page traffic drops, and organic conversion analysis.
---

# Review SEO performance

Read the [reporting workflow](../reporting/references/reporting-workflow.md) and [measurement rules](../reporting/references/measurement.md).

Use the requested period; otherwise use the last 28 completed days versus the preceding 28 days and state the dates. Account for any incomplete recent data identified by the source.

1. Discover Search Console fields for clicks, impressions, CTR, position, query, and landing page as needed. Fetch a site-level total separately from query/page details because detailed rows can omit data and need not sum to the site total.
2. Identify pages or queries contributing to changes, keeping device/country segments only when relevant. Recompute CTR from clicks and impressions. Do not sum average positions or treat a lower position number as a decline.
3. If the user asks about organic engagement or conversions and GA4 is connected, discover and retrieve the required channel and landing-page fields. Filter to the appropriate organic scope in returned data. Do not equate Search Console clicks with GA4 sessions.
4. Join page-level data only with a defensible URL normalization and compatible granularity. Preserve meaningful query parameters and paths; do not collapse distinct pages or silently discard unmatched rows.
5. Use PageSpeed only when page performance is relevant and the user has supplied or authorized the target URLs. Discover its fields, include the requested device strategy, and send today's date pair. A current page test cannot establish a historical performance regression.

Return the largest observed changes, the pages or queries to investigate, and evidence-backed next steps. High impressions with low CTR or declining position suggests an investigation; it does not prove a title problem or an algorithmic penalty.
