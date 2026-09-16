# Independent connection experiment — 2026-09-16

The **adzviser-desktop 0.1.0-rc.2** candidate uses a plugin-declared local stdio connection with `mcp-remote@0.14.2`, an independent server name, and an isolated OAuth cache. Its workflows require tools from that connection; they must not silently fall back to the directory connector. This revision adds a callback presentation adapter without replacing the helper's OAuth implementation.

## Evidence and limits

- **Automated OAuth/MCP integration:** `python3 scripts/test_desktop_connection.py` starts the actual packaged command against loopback fixtures. It verifies PKCE, a workspace tool call, a second session reusing authorization, a third session refreshing an expired access token, one client registration, and owner-only credential-file permissions. Credentials and data are synthetic. No Claude directory connector is configured.
- **Installed Desktop Code engine 2.1.170:** an isolated configuration with Claude.ai connectors disabled and this plugin loaded discovered eight skills and reported `plugin:adzviser-desktop:adzviser-independent` connected against the synthetic OAuth/MCP fixture. `${CLAUDE_PLUGIN_DATA}` resolved to the isolated plugin data directory. This was a subprocess test of the embedded engine, not an interactive test of the whole Desktop application.
- **Live Adzviser endpoint:** a fresh isolated client reached `https://mcp.adzviser.com` browser authorization using PKCE S256 and a localhost callback. The probe stopped before user authorization. It accessed no account data and proves neither real login completion nor real report accuracy.
- **Interactive Linux Desktop test, rc.1:** the tester completed browser authorization and supplied a screenshot showing a successful workspace call through `plugin adzviser-desktop adzviser-independent`. This confirms real account access through the independent plugin connection in that installation. It does not establish restart persistence or report accuracy.
- **Branded callback, rc.2:** the integration test verifies the actual helper serves the branded page while OAuth, workspace retrieval, restart, and refresh still succeed. HTTP adapter tests cover failure status preservation, untrusted provider-error text, response lengths, nonce-based content policy, and unchanged non-callback routes. Chrome checks at 1440px and 390px cover layout, logo rendering, URL cleanup, close-button fallback, and no external page-resource requests.
- **Packaging:** strict Claude Code validation covers the marketplace, both plugin manifests, skills, agents, and extracted ZIPs. The Desktop files are generated from the shared workflows with connection-specific adaptations; CI rejects stale generated files.

The motivation is a local Desktop log entry showing the original remote plugin server being replaced with a no-op. Local inspection of that installed Desktop version confirmed that its plugin loader handles local stdio servers separately. This is evidence about that installation, not a universal statement that Desktop requires a separately installed connector. Organization policies still apply to local MCP servers.

## Required interactive acceptance test

Follow [the Desktop edition guide](../desktop/README.md). Test with the original remote plugin turned off and the directory connector disabled:

1. Install the candidate from the GitHub marketplace into a normal local Code project.
2. Complete its own browser sign-in, without changing connector settings.
3. Retrieve actual workspaces through the independent server and compare them with the Adzviser account.
4. Start another conversation in the same project and repeat without another sign-in.
5. Fetch a small report with known source totals and compare the results.

Do not mark this edition ready for directory submission until these checks pass. Cowork, Chat, Windows, and remote Code sessions need their own compatibility tests; this candidate does not claim support for them. Installing Node/npm is an additional prerequisite, so this is a connection-independence experiment rather than a demonstrated improvement for every customer's onboarding.

## Development

Edit shared workflows at the repository root, and Desktop-only guidance in `templates/desktop/`. Run:

```bash
python3 scripts/build_desktop.py
python3 scripts/build_desktop.py --check
node --test scripts/callback-page.test.cjs
python3 scripts/test_desktop_connection.py
python3 scripts/package_plugin.py --edition desktop
```

The test requires Node.js 22.12+, npm registry access on its first run, and loopback sockets. It suppresses browser launch and follows only its own synthetic local authorization flow. It does not load developer credentials. Keep the experiment separate from backend deployment; no `mcp/deploy.sh` change is involved.
