#!/usr/bin/env python3
"""Exercise the packaged bridge against local MCP/OAuth fixtures; never use real credentials."""

import base64
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import queue
import signal
import socket
import subprocess
import tempfile
import threading
import time
from urllib.parse import parse_qs, urlencode, urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


class Fixture(BaseHTTPRequestHandler):
    registrations = 0
    authorizations = 0
    refreshes = 0
    challenge = None
    calls = 0

    def log_message(self, *args):
        pass

    @property
    def origin(self):
        return f"http://127.0.0.1:{self.server.server_port}"

    def reply(self, status, body=None, **headers):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        for key, value in headers.items():
            self.send_header(key.replace("_", "-"), value)
        self.end_headers()
        if body is not None:
            self.wfile.write(json.dumps(body).encode())

    def do_GET(self):
        path = urlsplit(self.path)
        if path.path.startswith("/.well-known/oauth-protected-resource"):
            return self.reply(200, {"resource": self.origin + "/mcp", "authorization_servers": [self.origin]})
        if path.path.startswith("/.well-known/oauth-authorization-server"):
            return self.reply(200, {
                "issuer": self.origin,
                "authorization_endpoint": self.origin + "/authorize",
                "token_endpoint": self.origin + "/token",
                "registration_endpoint": self.origin + "/register",
                "response_types_supported": ["code"],
                "grant_types_supported": ["authorization_code", "refresh_token"],
                "token_endpoint_auth_methods_supported": ["none"],
                "code_challenge_methods_supported": ["S256"],
            })
        if path.path == "/authorize":
            params = parse_qs(path.query)
            if params.get("code_challenge_method") != ["S256"] or not params.get("state"):
                return self.reply(400, {"error": "PKCE and state required"})
            Fixture.authorizations += 1
            Fixture.challenge = params["code_challenge"][0]
            callback = params["redirect_uri"][0]
            if urlsplit(callback).hostname not in ("localhost", "127.0.0.1"):
                return self.reply(400, {"error": "Non-local callback refused"})
            return self.reply(302, Location=callback + "?" + urlencode({"code": "fixture-code", "state": params["state"][0]}))
        if path.path == "/mcp":
            return self.reply(405)
        self.reply(404)

    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if self.path == "/register":
            Fixture.registrations += 1
            return self.reply(201, {**json.loads(raw), "client_id": "synthetic-client"})
        if self.path == "/token":
            params = parse_qs(raw.decode())
            grant = params.get("grant_type", [""])[0]
            if grant == "authorization_code":
                verifier = params.get("code_verifier", [""])[0]
                digest = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip("=")
                if params.get("code") != ["fixture-code"] or digest != Fixture.challenge:
                    return self.reply(400, {"error": "invalid_grant"})
            elif grant == "refresh_token" and params.get("refresh_token") == ["synthetic-refresh"]:
                Fixture.refreshes += 1
            else:
                return self.reply(400, {"error": "invalid_grant"})
            return self.reply(200, {"access_token": "synthetic-access", "refresh_token": "synthetic-refresh", "token_type": "Bearer", "expires_in": 3600})
        if self.path != "/mcp":
            return self.reply(404)
        if self.headers.get("Authorization") != "Bearer synthetic-access":
            return self.reply(401, {"error": "unauthorized"}, WWW_Authenticate=f'Bearer resource_metadata="{self.origin}/.well-known/oauth-protected-resource"')
        request = json.loads(raw)
        if "id" not in request:
            return self.reply(202)
        method = request["method"]
        if method == "initialize":
            result = {"protocolVersion": "2025-03-26", "capabilities": {"tools": {}}, "serverInfo": {"name": "synthetic-adzviser", "version": "1.0.0"}}
        elif method == "tools/list":
            result = {"tools": [{"name": "list_workspace", "description": "List synthetic test workspaces", "inputSchema": {"type": "object", "properties": {}}}]}
        elif method == "tools/call" and request["params"]["name"] == "list_workspace":
            Fixture.calls += 1
            result = {"content": [{"type": "text", "text": '[{"name":"Fixture workspace","sources":["Google Ads"]}]'}]}
        else:
            result = {}
        self.reply(200, {"jsonrpc": "2.0", "id": request["id"], "result": result})


class Bridge:
    def __init__(self, config, env):
        self.process = subprocess.Popen([config["command"], *config["args"]], env=env,
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                        text=True, start_new_session=True)
        self.responses = queue.Queue()
        self.stderr = []
        self.authorization_file = Path(env['SYNTHETIC_AUTH_URL_FILE'])
        self.authorize = True
        self.notifications = []
        def output():
            for line in self.process.stdout:
                try:
                    self.responses.put(json.loads(line))
                except ValueError:
                    self.responses.put({"error": "Non-JSON text on MCP stdout"})
        def errors():
            for line in self.process.stderr:
                self.stderr.append(line)
        threading.Thread(target=output, daemon=True).start()
        threading.Thread(target=errors, daemon=True).start()

    def request(self, ident, method, params=None):
        message = {"jsonrpc": "2.0", "method": method}
        if ident is not None:
            message["id"] = ident
        if params is not None:
            message["params"] = params
        self.process.stdin.write(json.dumps(message) + "\n")
        self.process.stdin.flush()
        if ident is None:
            return
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline:
            if self.authorize and self.authorization_file.exists():
                url = self.authorization_file.read_text()
                self.authorization_file.unlink()
                assert urlsplit(url).hostname == '127.0.0.1'
                callback = urlsplit(parse_qs(urlsplit(url).query)["redirect_uri"][0])
                ready_by = time.monotonic() + 10
                while True:
                    try:
                        with socket.create_connection((callback.hostname, callback.port), timeout=0.2):
                            break
                    except OSError:
                        if time.monotonic() >= ready_by:
                            raise AssertionError("OAuth callback did not start: " + "".join(self.stderr)[-1800:])
                        time.sleep(0.05)
                with urlopen(url, timeout=10) as response:
                    assert response.status == 200
                    html = response.read().decode()
                    assert 'Back to your insights.' in html
                    assert 'Return to your conversation' in html
                    assert 'return to the CLI' not in html
                    assert 'fixture-code' not in html
                    assert 'history.replaceState' in html
                    assert response.headers['Cache-Control'] == 'no-store'
                    assert response.headers['Referrer-Policy'] == 'no-referrer'
                    assert "default-src 'none'" in response.headers['Content-Security-Policy']
            try:
                result = self.responses.get(timeout=0.1)
                if 'method' in result and 'id' not in result:
                    self.notifications.append(result['method'])
                if result.get("id") == ident:
                    assert "error" not in result, result
                    return result["result"]
            except queue.Empty:
                if self.process.poll() is not None:
                    break
        # All auth values here are synthetic; keep output short even on failures.
        raise AssertionError(f"Bridge failed for {method}: {''.join(self.stderr)[-2200:]}")

    def wait_connected(self):
        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            result = self.request(80, 'tools/call', {'name': 'adzviser_connection_status', 'arguments': {}})
            state = result['structuredContent']['state']
            assert state != 'failed', result
            if state == 'connected':
                return
            time.sleep(.1)
        raise AssertionError('Connection did not finish')

    def close(self, graceful=False):
        if graceful:
            self.process.stdin.close()
            try:
                self.process.wait(timeout=8)
                assert self.process.returncode == 0, 'Gateway should exit cleanly on host disconnect'
                return
            except subprocess.TimeoutExpired:
                self.close()
                raise AssertionError('Host disconnect left the helper running')
        try:
            os.killpg(self.process.pid, signal.SIGTERM)
            self.process.wait(timeout=5)
        except (ProcessLookupError, subprocess.TimeoutExpired):
            if self.process.poll() is None:
                os.killpg(self.process.pid, signal.SIGKILL)
                self.process.wait()


def main():
    with tempfile.TemporaryDirectory(prefix="adzviser-connection-test-") as temporary:
        root = Path(temporary)
        # Stop browser launch during a synthetic test. Authorization is followed above.
        bin_dir = root / "bin"
        bin_dir.mkdir()
        for name in ("xdg-open", "gio", "x-www-browser", "wslview", "test-browser"):
            executable = bin_dir / name
            executable.write_text("#!/bin/sh\nexit 0\n")
            executable.chmod(0o700)
        (bin_dir / 'test-browser').write_text('#!/usr/bin/env python3\nimport os,sys\nfrom pathlib import Path\nPath(os.environ["SYNTHETIC_AUTH_URL_FILE"]).write_text(sys.argv[-1])\n')
        server = ThreadingHTTPServer(("127.0.0.1", 0), Fixture)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        config = json.loads((ROOT / ".mcp.json").read_text())["mcpServers"]["adzviser"]
        config["args"] = [arg.replace("https://mcp.adzviser.com/http", f"http://127.0.0.1:{server.server_port}/mcp").replace("${CLAUDE_PLUGIN_ROOT}", str(ROOT)) for arg in config["args"]]
        # Do not inherit credentials from the developer or CI environment.
        env = {key: value for key, value in os.environ.items() if key in ("PATH", "HOME", "SYSTEMROOT", "NPM_CONFIG_CACHE", "npm_config_cache")}
        env.update({key: value.replace("${CLAUDE_PLUGIN_DATA}", str(root / "plugin-data")) for key, value in config["env"].items()})
        env.update(PATH=f"{bin_dir}{os.pathsep}{env['PATH']}", BROWSER=str(bin_dir / "test-browser"), CLAUDE_CONFIG_DIR=str(root / "empty-claude"), SYNTHETIC_AUTH_URL_FILE=str(root / 'authorization-url'))
        try:
            for session in range(3):
                bridge = Bridge(config, env)
                try:
                    start = time.monotonic()
                    initialized = bridge.request(1, "initialize", {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "fixture-client", "version": "1"}})
                    assert time.monotonic() - start < 10, 'Local initialization must not wait for OAuth'
                    assert initialized['capabilities']['tools']['listChanged'] is True
                    bridge.request(None, "notifications/initialized")
                    if session == 0:
                        bridge.authorize = False
                        tools = bridge.request(2, 'tools/list')['tools']
                        assert [t['name'] for t in tools] == ['adzviser_connection_status']
                        pending = bridge.request(3, 'tools/call', {'name': 'list_workspace', 'arguments': {}})
                        assert pending['isError'] and Fixture.calls == 0
                        assert bridge.request(4, 'resources/list') == {'resources': []}
                        assert bridge.request(5, 'prompts/list') == {'prompts': []}
                        bridge.authorize = True
                    bridge.wait_connected()
                    tools = bridge.request(2, "tools/list")["tools"]
                    assert any(t["name"] == "list_workspace" for t in tools)
                    data = bridge.request(3, "tools/call", {"name": "list_workspace", "arguments": {}})
                    assert json.loads(data["content"][0]["text"])[0]["name"] == "Fixture workspace"
                    assert 'notifications/tools/list_changed' in bridge.notifications
                    assert not any('synthetic-access' in line or '/authorize?' in line for line in bridge.stderr)
                finally:
                    bridge.close()
                tokens = list((root / "plugin-data/auth").rglob("*_tokens.json"))
                assert len(tokens) == 1, "Expected a dedicated token cache"
                assert tokens[0].stat().st_mode & 0o077 == 0, "Credential permissions must be owner-only"
                if session == 1:
                    # Force expiry so the third session must use its own refresh token.
                    token = json.loads(tokens[0].read_text())
                    token["expires_at"] = 1
                    tokens[0].write_text(json.dumps(token))
            assert Fixture.registrations == 1, "Restart should reuse the registered client"
            assert Fixture.authorizations == 1, "Restart should reuse authorization"
            assert Fixture.refreshes == 1, "Expired access token must refresh"
            assert Fixture.calls == 3
            # A user who never completes sign-in should get an actionable status,
            # while the local server remains usable rather than failing startup.
            failure_env = {**env, 'MCP_REMOTE_CONFIG_DIR': str(root / 'cancelled-auth')}
            failure_config = {**config, 'args': list(config['args'])}
            failure_config['args'][failure_config['args'].index('--auth-timeout') + 1] = '2'
            bridge = Bridge(failure_config, failure_env)
            bridge.authorize = False
            try:
                bridge.request(1, 'initialize', {'protocolVersion': '2025-03-26', 'capabilities': {}, 'clientInfo': {'name': 'fixture-client', 'version': '1'}})
                bridge.request(None, 'notifications/initialized')
                deadline = time.monotonic() + 12
                states = []
                while time.monotonic() < deadline:
                    result = bridge.request(2, 'tools/call', {'name': 'adzviser_connection_status', 'arguments': {}})
                    states.append(result['structuredContent']['state'])
                    if states[-1] == 'failed':
                        break
                    time.sleep(.1)
                assert 'awaiting_sign_in' in states and states[-1] == 'failed', states
                assert bridge.request(3, 'ping') == {}
                assert [t['name'] for t in bridge.request(4, 'tools/list')['tools']] == ['adzviser_connection_status']
                failed_call = bridge.request(5, 'tools/call', {'name': 'list_workspace', 'arguments': {}})
                assert failed_call['isError'] and Fixture.calls == 3
                assert not any('/authorize?' in line or 'synthetic-access' in line for line in bridge.stderr)
            finally:
                bridge.close(graceful=True)
            print("PASS: immediate initialization, pending status, tool-list notification, branded callback, OAuth PKCE, workspace call, restart persistence, token refresh, owner-only storage, sign-in expiry, clean shutdown. No directory connector used.")
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
