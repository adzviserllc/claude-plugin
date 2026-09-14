---
name: budget-pacing
description: Check marketing spend against a stated budget with Adzviser. Use for monthly pacing, remaining budget, projected overspend, or a proposed allocation based on observed performance.
---

# Check budget pacing

Read the [reporting workflow](../reporting/references/reporting-workflow.md) and [measurement rules](../reporting/references/measurement.md).

Use the user's budget amount, currency, period, and account/channel scope. If the budget is missing, retrieve relevant spend while asking for the amount and period; do not infer a budget from observed spend. Default an unspecified pacing period to the current calendar month and state that assumption.

Retrieve daily spend from the period start through the last completed reporting day. Exclude today's partial spend from a full-day average, or report it separately. Confirm the reported currency matches the budget.

For a uniform daily pacing assumption, let `B` be budget, `S` observed spend across `d` completed days, and `D` the total days in the budget period:

- Expected spend to date: `B × d / D`.
- Pacing variance: `S − expected spend` (positive means ahead of pace).
- Remaining budget: `B − S` (show negative amounts as overspend).
- Projected period spend: `S / d × D`, only when `d > 0`.
- Allowable average for remaining days: `(B − S) / (D − d)`, only when days remain and the remaining budget is nonnegative. If already overspent, report the overage rather than a negative daily allowance.

On the first day with no completed days, report that there is no completed-day projection yet. At period end, report actual versus budget and omit a remaining-day allowance. Check data completeness before treating days with missing rows as zero spend.

Label the projection as a straight-line scenario; it is not a forecast that accounts for seasonality or future campaign changes. Use the user's known daily budget schedule instead when supplied. Show planned changes as scenarios, with assumptions and arithmetic, and keep recommendations separate from account actions. Do not claim budgets were updated.
