#!/usr/bin/env python3
"""Generate the experimental Desktop edition from the shared workflows."""

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "desktop"


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError("Shared workflow changed; review the Desktop adaptation before generating")
    return text.replace(old, new)


def expected_files():
    files = {}
    for directory in ("skills", "agents", "assets"):
        for path in (ROOT / directory).rglob("*"):
            if path.is_symlink():
                raise ValueError(f"Refusing symlink: {path}")
            if path.is_file():
                files[path.relative_to(ROOT).as_posix()] = path.read_bytes()
    files["LICENSE"] = (ROOT / "LICENSE").read_bytes()
    for name in ("README.md", "skills/setup/references/connection.md"):
        files[name] = (ROOT / "templates/desktop" / name).read_bytes()
    for path in (ROOT / "templates/desktop/runtime").glob("*"):
        if path.is_symlink():
            raise ValueError(f"Refusing symlink: {path}")
        if path.is_file():
            files[f"runtime/{path.name}"] = path.read_bytes()
    setup = replace_once(files["skills/setup/SKILL.md"].decode(),
        "Using the shared connection is sufficient; a second plugin-specific connection is not required.",
        "Use this edition's independent connection as described in the connection guidance.",
    ).replace("/adzviser:", "/adzviser-desktop:").replace("**(adzviser)**", "**(adzviser-desktop)**")
    files["skills/setup/SKILL.md"] = setup.encode()
    reporting = "skills/reporting/references/reporting-workflow.md"
    files[reporting] = replace_once(files[reporting].decode(),
        "Use the Adzviser tools exposed by the current session, not a guessed HTTP API. In terminal Claude Code, a tool can appear as `mcp__plugin_adzviser_adzviser__retrieve_reporting_data`; Desktop may supply it through the shared Adzviser connector with a different prefix. Do not require a plugin-specific prefix or ask users to disable that connector. The names below are the unprefixed tool names.",
        "Use the tools supplied by this edition's independent Adzviser connection, following the connection guidance above. Do not use a guessed HTTP API or silently substitute the directory connector. Tool name punctuation varies by host; check the tool's origin. The names below are the unprefixed tool names.",
    ).encode()
    manifest = json.loads((ROOT / ".claude-plugin/plugin.json").read_text())
    manifest.update(
        name="adzviser-desktop",
        version="0.1.0-rc.3",
        description="Experimental Adzviser for local Claude Code: marketing workflows with an independent browser sign-in. No directory connector required. Requires Node.js 22.12+ and npm.",
    )
    files[".claude-plugin/plugin.json"] = (json.dumps(manifest, indent=2) + "\n").encode()
    mcp = {"mcpServers": {"adzviser-independent": {
        "type": "stdio",
        "command": "npx",
        "args": ["--yes", "--ignore-scripts", "--package=mcp-remote@0.14.2", "node",
                 "${CLAUDE_PLUGIN_ROOT}/runtime/connect.cjs", "https://mcp.adzviser.com/http",
                 "--transport", "http-only", "--auth-timeout", "300",
                 "--static-oauth-client-metadata", '{"client_name":"Adzviser-Desktop-Plugin"}'],
        "env": {"MCP_REMOTE_CONFIG_DIR": "${CLAUDE_PLUGIN_DATA}/auth", "NPM_CONFIG_IGNORE_SCRIPTS": "true"},
    }}}
    files[".mcp.json"] = (json.dumps(mcp, indent=2) + "\n").encode()
    return files


def build(check=False):
    files = expected_files()
    actual = {p.relative_to(DEST).as_posix() for p in DEST.rglob("*") if p.is_file()}
    unexpected = actual - files.keys()
    if unexpected:
        raise SystemExit(f"Unexpected Desktop files; inspect before removing: {sorted(unexpected)}")
    changed = []
    for name, content in files.items():
        path = DEST / name
        if not path.exists() or path.read_bytes() != content:
            changed.append(name)
            if not check:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)
    if check and changed:
        raise SystemExit(f"Run python3 scripts/build_desktop.py; stale files: {changed}")
    print(f"Desktop edition: {len(files)} files {'verified' if check else 'generated'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    build(parser.parse_args().check)
