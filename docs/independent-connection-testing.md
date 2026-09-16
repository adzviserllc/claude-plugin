# Adzviser connection test evidence — 2026-09-16

**Adzviser 1.1.0-rc.2** consolidates the successful local-connection experiment into the root plugin. The catalog now has one `adzviser` entry and one MCP server named `adzviser`. The former `adzviser-desktop` package and `adzviser-independent` server names appear below only as historical test evidence. They are no longer distributed as another edition.

## Evidence and limits

- **Automated OAuth/MCP integration:** `python3 scripts/test_desktop_connection.py` starts the actual packaged command against loopback fixtures. It verifies PKCE, a workspace tool call, a second session reusing authorization, a third session refreshing an expired access token, one client registration, and owner-only credential-file permissions. Credentials and data are synthetic. No Claude directory connector is configured.
- **Consolidated package, 1.1.0-rc.2:** an isolated run of the installed Desktop Code 2.1.170 engine loaded the packaged ZIP with Claude.ai connectors disabled, discovered eight skills, and reported `plugin:adzviser:adzviser` connected after one synthetic sign-in. The packaged helper also passed workspace retrieval, restart reuse, and expired-token refresh against the local fixture. This does not replace the interactive acceptance checks below.
- **Installed Desktop Code engine 2.1.170:** an isolated configuration with Claude.ai connectors disabled and this plugin loaded discovered eight skills and reported `plugin:adzviser-desktop:adzviser-independent` connected against the synthetic OAuth/MCP fixture. `${CLAUDE_PLUGIN_DATA}` resolved to the isolated plugin data directory. This was a subprocess test of the embedded engine, not an interactive test of the whole Desktop application.
- **Live Adzviser endpoint:** a fresh isolated client reached `https://mcp.adzviser.com` browser authorization using PKCE S256 and a localhost callback. The probe stopped before user authorization. It accessed no account data and proves neither real login completion nor real report accuracy.
- **Interactive Linux Desktop test, rc.1:** the tester completed browser authorization and supplied a screenshot showing a successful workspace call through `plugin adzviser-desktop adzviser-independent`. This confirms real account access through the independent plugin connection in that installation. It does not establish restart persistence or report accuracy.
- **Branded callback:** the integration test verifies the actual helper serves the branded page while OAuth, workspace retrieval, restart, and refresh still succeed. HTTP adapter tests cover failure status preservation, untrusted provider-error text, response lengths, nonce-based content policy, and unchanged non-callback routes. Chrome checks at 1440px and 390px cover layout, logo rendering, URL cleanup, manual-close guidance, and no external page-resource requests.
- **Packaging:** the current release has one root package and one marketplace entry. Strict validation covers its manifests, skills, agent, and extracted ZIP.

The motivation is a local Desktop log entry showing the original remote plugin server being replaced with a no-op. Local inspection of that installed Desktop version confirmed that its plugin loader handles local stdio servers separately. This is evidence about that installation, not a universal statement that Desktop requires a separately installed connector. Organization policies still apply to local MCP servers.

## Current acceptance and development

Follow the [single installation guide](../README.md) and [release checks](testing.md). Test the current package with the directory connector disabled. Real account access from the earlier experiment does not replace repeat-session and reporting checks for this candidate.

Edit the root workflows and runtime directly. Run `node --test scripts/callback-page.test.cjs`, `python3 scripts/test_desktop_connection.py`, and `python3 scripts/package_plugin.py`. The integration test uses synthetic credentials on loopback servers and never loads developer credentials. No backend deployment is involved.
