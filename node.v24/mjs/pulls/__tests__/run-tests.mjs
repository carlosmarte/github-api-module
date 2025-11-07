#!/usr/bin/env node
/**
 * Test runner for GitHub Pull Request API module
 * Runs Jest with ES module support
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Jest command with ES module support
const jestCommand = 'node';
const jestArgs = [
  '--experimental-vm-modules',
  'node_modules/jest/bin/jest.js',
  '--config',
  '__tests__/jest.config.mjs',
  '--verbose',
  ...process.argv.slice(2) // Pass through any additional arguments
];

console.log('🧪 Running tests with ES module support...\n');

const jestProcess = spawn(jestCommand, jestArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-vm-modules'
  }
});

jestProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log(`\n❌ Tests failed with exit code ${code}`);
  }
  process.exit(code);
});

jestProcess.on('error', (error) => {
  console.error('❌ Failed to start test runner:', error.message);
  process.exit(1);
});