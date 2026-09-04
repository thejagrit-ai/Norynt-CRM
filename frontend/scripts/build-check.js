#!/usr/bin/env node
/**
 * Type/compile verification build that is safe to run while `npm run dev`
 * is live.
 *
 * `next dev` and `next build` both write to .next by default, so building
 * against a running dev server deletes the assets it is serving: every page
 * then renders as unstyled HTML until dev is restarted. This points the build
 * at its own directory via NEXT_DIST_DIR (read by next.config.js).
 *
 * Use `npm run build` for real deploy output; this one is only for checking
 * that the app still compiles.
 */
const { spawn } = require('child_process');
const path = require('path');

const DIST = '.next-check';
const nextBin = path.join(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'next.cmd' : 'next'
);

const child = spawn(nextBin, ['build'], {
  cwd: path.join(__dirname, '..'),
  env: { ...process.env, NEXT_DIST_DIR: DIST },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (err) => {
  console.error('[build-check] failed to start next build:', err.message);
  process.exit(1);
});
