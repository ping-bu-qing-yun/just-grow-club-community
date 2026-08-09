import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const serverDir = resolve('dist/server');
const entry = resolve(serverDir, 'index.js');

const workerSource = `const INDEX_PATH = '/index.html';

function shouldServeIndex(request, response) {
  if (request.method !== 'GET') return false;
  if (response.status !== 404) return false;
  const { pathname } = new URL(request.url);
  return !pathname.includes('.');
}

export default {
  async fetch(request, env) {
    if (!env?.ASSETS?.fetch) {
      return new Response('Static asset binding is unavailable.', { status: 500 });
    }

    const response = await env.ASSETS.fetch(request);
    if (!shouldServeIndex(request, response)) return response;

    const indexUrl = new URL(INDEX_PATH, request.url);
    return env.ASSETS.fetch(new Request(indexUrl, request));
  },
};
`;

await mkdir(serverDir, { recursive: true });
await writeFile(entry, workerSource);
