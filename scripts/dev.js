const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const server = spawn('npm', ['--prefix', 'server', 'run', 'dev'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit'
});

const client = spawn('npm', ['--prefix', 'client', 'run', 'dev'], {
  cwd: rootDir,
  shell: true,
  stdio: 'inherit'
});

function cleanup() {
  server.kill();
  client.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
