'use strict';

// npm exec adds its selected package's node_modules/.bin to PATH. Locate that
// package without modifying the npm cache, vendoring OAuth, or using a shell.
const { readFileSync, existsSync } = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { installCallbackPage } = require('./callback-page.cjs');

function findBridge() {
  for (const directory of (process.env.PATH || '').split(path.delimiter)) {
    if (path.basename(directory) !== '.bin') continue;
    const root = path.resolve(directory, '..', 'mcp-remote');
    const manifest = path.join(root, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    if (pkg.name === 'mcp-remote' && pkg.version === '0.14.2'
        && pkg.bin?.['mcp-remote'] === 'dist/proxy.js') {
      return path.join(root, 'dist/proxy.js');
    }
  }
  throw new Error('The pinned Adzviser connection helper was not found. Reconnect the plugin with Node.js and npm available.');
}

async function main() {
  const bridge = findBridge();
  installCallbackPage();
  // Keep argv[2..] unchanged: the upstream helper parses its normal options.
  await import(pathToFileURL(bridge).href);
}

main().catch((error) => {
  console.error('[Adzviser] Could not start the connection helper:', error.message);
  process.exitCode = 1;
});
