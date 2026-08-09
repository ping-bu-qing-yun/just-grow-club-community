import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
const args = process.argv.slice(2);
const configuredPort = Number(process.env.PLAYWRIGHT_PORT ?? 0);

if (!Number.isInteger(configuredPort) || configuredPort < 0 || configuredPort > 65535) {
  throw new Error('PLAYWRIGHT_PORT 必须是 0 到 65535 的整数');
}

const server = await createServer({
  root,
  mode: 'preview',
  logLevel: 'warn',
  server: { host: '127.0.0.1', port: configuredPort, strictPort: configuredPort !== 0 },
});

await server.listen();
const address = server.httpServer?.address();
if (!address || typeof address === 'string') {
  await server.close();
  throw new Error('无法确定 Playwright 预览服务端口');
}
const baseURL = `http://127.0.0.1:${address.port}`;

const child = spawn(process.execPath, [cli, 'test', ...args], {
  cwd: root,
  env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
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
