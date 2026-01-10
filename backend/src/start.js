// Start script for EtnoTermos - Runs both public and admin servers
// This script is used in production Docker environments

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting EtnoTermos dual-context servers...');

// Start public server (port 4000)
const publicServer = spawn('node', [path.join(__dirname, 'contexts/public/server.js')], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Start admin server (port 4001)
const adminServer = spawn('node', [path.join(__dirname, 'contexts/admin/server.js')], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Handle process termination
const shutdown = (signal) => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  publicServer.kill('SIGTERM');
  adminServer.kill('SIGTERM');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle child process errors
publicServer.on('error', (err) => {
  console.error('Public server error:', err);
  process.exit(1);
});

adminServer.on('error', (err) => {
  console.error('Admin server error:', err);
  process.exit(1);
});

// Handle child process exits
publicServer.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`Public server exited with code ${code}`);
    adminServer.kill('SIGTERM');
    process.exit(code);
  }
});

adminServer.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`Admin server exited with code ${code}`);
    publicServer.kill('SIGTERM');
    process.exit(code);
  }
});

console.log('Both servers started successfully');
console.log('Public server: http://localhost:4000');
console.log('Admin server: http://localhost:4001');
