import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
const args = process.argv.slice(2);

const server = await createServer({
  root,
  mode: 'preview',
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
});

await server.listen();

const child = spawn(process.execPath, [cli, 'test', ...args], {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

const forwardSignal = (signal) => {
  if (!child.killed) child.kill(signal);
};
process.once('SIGINT', forwardSignal);
process.once('SIGTERM', forwardSignal);

const exitCode = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (code) => resolve(code ?? 1));
});

await server.close();
process.exitCode = exitCode;
