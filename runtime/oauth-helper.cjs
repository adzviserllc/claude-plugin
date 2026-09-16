'use strict';

// OAuth and credential storage remain entirely in the pinned upstream helper.
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { findPackage } = require('./connect.cjs');
const { installCallbackPage } = require('./callback-page.cjs');

installCallbackPage();
const bridge = path.join(findPackage('mcp-remote', '0.14.2'), 'dist/proxy.js');
import(pathToFileURL(bridge).href).catch(() => {
  console.error('[Adzviser] The authorization helper could not start.');
  process.exitCode = 1;
});
