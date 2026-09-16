# Measurement rules

Keep platform, workspace/account, period, currency, attribution definition, and reporting grain attached to values. These rules apply to performance, pacing, SEO, and commerce comparisons.

## Aggregation

Compute ratios from comparable totals, not averages of row-level ratios:

| Metric | Calculation |
| --- | --- |
| CTR | clicks / impressions × 100 |
| CPC | spend / clicks |
| CPM | spend / impressions × 1,000 |
| CPA | spend / the specified conversion count |
| ROAS | the specified attributed revenue / spend |
| Average order value | the specified order revenue / eligible order count |
| Relative change | (current − previous) / previous × 100 |

A zero or missing denominator produces an undefined value, shown as `N/A` with the reason. Missing values are not zeros. When the prior value is zero, show the absolute change instead of an infinite percentage. Distinguish percentage-point changes in rates from relative percentage changes.

Preserve source units. Convert micros or percentages only when the returned metadata establishes their representation. Do not sum currencies without a supplied, dated conversion basis; otherwise show separate totals.

Unique users, reach, distinct customers, and some engagement/position metrics are not additive across dates or segments. Retrieve the appropriate total or label the limit instead of summing daily uniques. Use the source-reported aggregate for average position when available.

## Attribution and joins

Ad platforms can each claim the same purchase. Platform-attributed revenue and conversions should remain separate unless a valid deduplication method is available. Store revenue, GA4 revenue, and ad-attributed revenue are different measures; never sum them as total business revenue.

For a blended marketing efficiency ratio, divide store revenue by total comparable ad spend and label it **MER**, not platform ROAS or causal return. Use matching dates, currencies, and revenue definitions. Do not infer incremental lift from an observational report.

Join sources only on verified, compatible keys and grain. Campaign names may be nonunique; ad-platform IDs are not necessarily analytics IDs. Aggregate before a join where needed, check row counts and totals, and keep unmatched rows visible. Without a trustworthy join key, use side-by-side summaries.

## Interpretation

Separate observed changes, possible explanations, and recommended checks. Delayed conversions, tracking changes, partial days, returns, timezones, and attribution windows can change comparisons. Report a tracking issue as a hypothesis unless actual evidence establishes it. Describe small samples before proposing a budget change. The plugin cannot implement changes to bids, budgets, or campaigns.
