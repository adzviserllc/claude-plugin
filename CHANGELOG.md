# Release notes

## 1.1.0 — 2026-09-16

Adzviser is now one plugin with eight workflows, a marketing analyst agent, and its own browser sign-in for local Claude Code. The separate Adzviser directory connector is not required.

- Keeps the local connection available while browser sign-in completes, then exposes data tools in the same conversation. This fixes the first-sign-in startup timeout.
- Provides connection status while waiting and reuses saved authorization in subsequent sessions.
- Consolidates the earlier Desktop experiment into one **Adzviser** plugin and one **adzviser** server.
- Adds a branded sign-in confirmation page with clear instructions for returning to Claude Desktop.

This release promotes 1.1.0-rc.3 without changing its runtime or skills. Existing rc.3 users receive a simpler version label and updated documentation; their saved-login location is unchanged. No backend deployment is required.

### Verification and limits

Linux Desktop Code testing confirmed real workspace access, Google Ads reporting, period comparison, and access in a new conversation. Screenshots show the plugin's own tool calls and missing-data handling; the full comparison analysis was not visible. Automated tests cover OAuth, saved-login reuse, token refresh, abandoned sign-in, and a 40-second sign-in with tools appearing in the same Claude Code session.

A manual delayed first sign-in and comparison against source-platform reports remain outstanding. Cowork, Chat, remote Code, macOS, and Windows have not been verified. Local Claude Code requires Node.js 22.12+ and npm.

### Update

Refresh the Adzviser marketplace, update the installed Adzviser plugin, then fully quit and reopen Claude Desktop. Closing only the window may leave the old process running. Confirm that the plugin details show **1.1.0**.

The GitHub release and repository marketplace are separate from Anthropic's directory review.
