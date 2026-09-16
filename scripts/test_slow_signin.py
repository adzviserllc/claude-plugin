#!/usr/bin/env python3
"""Regress Claude's 30-second startup timeout using a slow, synthetic browser login.

No model requests, real credentials, installed plugins, or user settings are used.
"""
import argparse
import json
import os
from pathlib import Path
import queue
import shutil
import signal
import subprocess
import tempfile
import threading
import time

from test_desktop_connection import Fixture, ROOT, ThreadingHTTPServer


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--claude', default=shutil.which('claude'))
    options = parser.parse_args()
    if not options.claude:
        parser.error('Supply --claude with a Claude Code executable')
    with tempfile.TemporaryDirectory(prefix='adzviser-slow-signin-test-') as temporary:
        root = Path(temporary)
        plugin = root / 'plugin'
        plugin.mkdir()
        for name in ('.claude-plugin', 'skills', 'agents', 'assets', 'runtime'):
            shutil.copytree(ROOT / name, plugin / name)
        fixture = ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
        threading.Thread(target=fixture.serve_forever, daemon=True).start()
        config = json.loads((ROOT / '.mcp.json').read_text())
        server = config['mcpServers']['adzviser']
        server['args'] = [a.replace('https://mcp.adzviser.com/http', f'http://127.0.0.1:{fixture.server_port}/mcp') for a in server['args']]
        (plugin / '.mcp.json').write_text(json.dumps(config))
        config_dir = root / 'config'
        config_dir.mkdir()
        (config_dir / 'settings.json').write_text(json.dumps({'disableClaudeAiConnectors': True}))
        browser = root / 'browser'
        browser.write_text('''#!/usr/bin/env python3
import socket,sys,time
from urllib.parse import parse_qs,urlsplit
from urllib.request import urlopen
url=sys.argv[-1]
assert urlsplit(url).hostname == '127.0.0.1'
time.sleep(40)
callback=urlsplit(parse_qs(urlsplit(url).query)['redirect_uri'][0])
for _ in range(100):
 try:
  with socket.create_connection((callback.hostname,callback.port),timeout=.2): break
 except OSError: time.sleep(.1)
with urlopen(url,timeout=10) as response:
 assert response.status == 200
''')
        browser.chmod(0o700)
        env = {k: v for k, v in os.environ.items() if k in ('HOME', 'PATH', 'SYSTEMROOT', 'NPM_CONFIG_CACHE', 'npm_config_cache')}
        env.update(CLAUDE_CONFIG_DIR=str(config_dir), BROWSER=str(browser))
        processes = []

        def session(label, limit):
            process = subprocess.Popen([
                options.claude, '--print', '--input-format', 'stream-json', '--output-format', 'stream-json',
                '--verbose', '--setting-sources', 'user', '--no-session-persistence', '--plugin-dir', str(plugin),
            ], cwd=root, env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                text=True, start_new_session=True)
            processes.append(process)
            messages = queue.Queue()

            def output():
                for line in process.stdout:
                    try:
                        messages.put(json.loads(line))
                    except ValueError:
                        pass

            def errors():
                for _ in process.stderr:
                    pass

            threading.Thread(target=output, daemon=True).start()
            threading.Thread(target=errors, daemon=True).start()

            def send(ident, subtype):
                process.stdin.write(json.dumps({'type': 'control_request', 'request_id': ident, 'request': {'subtype': subtype}}) + '\n')
                process.stdin.flush()

            start = time.monotonic()
            next_status = 0
            connected_at = None
            send('init', 'initialize')
            while time.monotonic() - start < limit:
                if time.monotonic() > next_status:
                    send('status', 'mcp_status')
                    next_status = time.monotonic() + .5
                try:
                    result = messages.get(timeout=.2)
                except queue.Empty:
                    assert process.poll() is None, 'Claude engine exited before tool discovery'
                    continue
                response = result.get('response', {})
                if response.get('request_id') != 'status':
                    continue
                for item in response.get('response', {}).get('mcpServers', []):
                    if item.get('name') != 'plugin:adzviser:adzviser':
                        continue
                    elapsed = time.monotonic() - start
                    assert item.get('status') != 'failed', 'Host cached a failed connection during browser sign-in'
                    if item.get('status') != 'connected':
                        continue
                    names = [tool['name'] for tool in item.get('tools', [])]
                    if connected_at is None:
                        connected_at = elapsed
                        assert connected_at < 10, 'Host startup still waits for browser authorization'
                        assert any('adzviser_connection_status' in name for name in names), names
                        if label == 'first':
                            assert Fixture.authorizations == 0, 'The slow login should still be pending'
                        print(f'{label}: local connection ready at {connected_at:.1f}s', flush=True)
                    if any('list_workspace' in name for name in names):
                        if label == 'first':
                            assert elapsed > 40, 'Login did not exceed the host startup timeout'
                        print(f'{label}: workspace tool available in the same session at {elapsed:.1f}s', flush=True)
                        return process
            raise AssertionError('Data tools did not appear after authorization')

        def stop(process):
            try:
                os.killpg(process.pid, signal.SIGTERM)
                process.wait(timeout=6)
            except (ProcessLookupError, subprocess.TimeoutExpired):
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.wait()

        try:
            first = session('first', 70)
            stop(first)
            session('restart', 20)
            assert Fixture.authorizations == 1, 'Restart should reuse the saved login'
            assert Fixture.registrations == 1, 'Restart should reuse its OAuth client'
            cache = config_dir / 'mcp-needs-auth-cache.json'
            if cache.exists():
                assert 'plugin:adzviser:adzviser' not in json.loads(cache.read_text())
            print('PASS: 40-second sign-in does not time out startup; tools appear without restarting; saved login survives the next session.', flush=True)
        finally:
            for process in processes:
                stop(process)
            fixture.shutdown()
            fixture.server_close()


if __name__ == '__main__':
    main()
