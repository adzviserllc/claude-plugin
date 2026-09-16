'use strict';

// npm exec adds its selected package's node_modules/.bin to PATH. Locate that
// package without modifying the npm cache, vendoring OAuth, or using a shell.
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function findPackage(name, version) {
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    if (path.basename(directory) !== '.bin') continue;
    const root = path.resolve(directory, '..', name);
    const manifest = path.join(root, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    if (pkg.name === name && pkg.version === version) return root;
  }
  throw new Error(`The pinned ${name} package was not found. Reconnect with Node.js and npm available.`);
}

async function main() {
  const sdkRoot = findPackage('@modelcontextprotocol/sdk', '1.30.0');
  const { startConnectionServer } = await import(pathToFileURL(path.join(__dirname, 'connection-server.mjs')).href);
  await startConnectionServer(sdkRoot, process.argv.slice(2));
}

module.exports = { findPackage };
if (require.main === module) {
  main().catch(() => {
    console.error('[Adzviser] Could not start the connection helper. Check Node.js, npm, and the plugin installation.');
    process.exitCode = 1;
  });
}
