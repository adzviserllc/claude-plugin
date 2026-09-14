---
name: ecommerce-review
description: Review ecommerce revenue, orders, products, and marketing efficiency with Adzviser. Use for Shopify or WooCommerce reporting and comparisons with advertising spend, GA4, or email performance.
---

# Review ecommerce performance

Read the [reporting workflow](../reporting/references/reporting-workflow.md) and [measurement rules](../reporting/references/measurement.md).

Use the requested store, workspace, period, and revenue definition. If no period is supplied, use the last completed calendar month and the prior calendar month, and show that the months may differ in length.

1. Discover store fields for revenue, orders, refunds, discounts, shipping, tax, and products only as needed and available. Preserve whether the source reports gross sales, net sales, or total sales. Do not claim a net-revenue measure if the necessary components are absent.
2. Fetch store totals separately from product detail when orders can repeat across line items. Do not sum repeated order totals or count line items as orders. Calculate average order value only from compatible revenue and order totals.
3. If the user requests marketing efficiency, retrieve comparable ad spend in the same currency and period. Compute MER as store revenue divided by total ad spend; keep it separate from each ad platform's attributed ROAS.
4. For email or analytics comparisons, use discovered fields from connected sources such as Klaviyo or GA4. Show their attributed revenue separately because the same sale may be claimed by multiple channels.
5. Explain which products, channels, or order patterns account for the observed change. Distinguish a timing or attribution difference from a demonstrated business change.

Default to aggregate business metrics. Customer names, emails, addresses, and individual order details are unnecessary for a normal revenue review. Do not retrieve or expose them without a task-specific need.
