---
name: reporting
description: Retrieve marketing, analytics, ecommerce, or CRM reporting rows from Adzviser and answer ad hoc data questions. Use for metric lookups, custom breakdowns, CSV exports, or datasets for a report or dashboard.
---

# Retrieve reporting data

Read the [reporting workflow](references/reporting-workflow.md) before constructing Adzviser requests. It defines workspace selection, date handling, field discovery, and the report envelope.

Fetch only the sources, fields, periods, and granularity needed for the user's question. Reuse previously retrieved rows when they cover the same scope and freshness requirement. Use `retrieve_reporting_data` to obtain rows that Claude can analyze.

For calculations or comparisons, read the [measurement rules](references/measurement.md). Answer with the returned values, the source and workspace, the exact period, and any material coverage gap. A request for one number should receive a concise answer.

If an export or dashboard dataset is requested, preserve source, date range, units, and currency with the data. Use local file tools when available; otherwise provide an inline table or CSV and explain the limitation. Keep private account data out of public repositories and published pages unless that destination is explicitly authorized. Export only the fields needed for the task.

Campaign edits, campaign creation, and scheduled jobs are not tools provided by this plugin. Present reporting-based recommendations as recommendations; do not claim an account change or recurring job was made.
