#!/usr/bin/env python3
"""Exercise the bundled HTTP route with synthetic OAuth; no local helper or real credentials."""

import json
import os
import subprocess
import threading

from test_desktop_connection import Fixture, ROOT, ThreadingHTTPServer


def main():
    config = json.loads((ROOT / '.mcp.json').read_text())['mcpServers']['cloud']
    assert config['type'] == 'http'
    assert not any(key in config for key in ('command', 'args', 'headers', 'env'))
    server = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    isolated_config = {**config, 'url': f'http://127.0.0.1:{server.server_port}/mcp'}
    env = {key: value for key, value in os.environ.items()
           if key in ('PATH', 'HOME', 'SYSTEMROOT', 'NPM_CONFIG_CACHE', 'npm_config_cache')}
    env['NPM_CONFIG_IGNORE_SCRIPTS'] = 'true'
    try:
        subprocess.run([
            'npx', '--yes', '--ignore-scripts', '--package=@modelcontextprotocol/sdk@1.30.0',
            'node', str(ROOT / 'scripts/remote-client.test.cjs'),
        ], input=json.dumps(isolated_config), text=True, env=env, check=True, timeout=60)
        assert Fixture.registrations == 1, 'The remote client should reuse its registration'
        assert Fixture.authorizations == 1, 'Only the initial session should authorize'
        assert Fixture.refreshes == 1, 'An expired access token should refresh'
        assert Fixture.calls == 3, 'Initial, resumed, and refreshed sessions must retrieve workspaces'
        print('PASS: bundled HTTP connection, OAuth discovery and PKCE, workspace calls, saved-login reuse, token refresh; no local helper or directory connector used.')
    finally:
        server.shutdown()
        server.server_close()


if __name__ == '__main__':
    main()
