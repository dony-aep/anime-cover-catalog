/**
 * Local dev server for the API — no Vercel CLI needed.
 *
 * Run: npm run api:dev   (then open http://localhost:8787/api/v1/docs)
 *
 * Bridges Node's http server to the Hono app via app.fetch(), and serves the
 * static images under /assets from src/assets so covers render in the browser.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { app } from '../index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_ROOT = resolve(__dirname, '../../src/assets');
const PORT = 8787;

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  const rawUrl = req.url ?? '/';

  // Serve static assets (images) directly from src/assets.
  if (rawUrl.startsWith('/assets/')) {
    const rel = normalize(decodeURI(rawUrl.replace(/^\/assets\//, ''))).replace(/^(\.\.[/\\])+/, '');
    const filePath = join(ASSETS_ROOT, rel);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
      res.setHeader('Content-Type', MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream');
      createReadStream(filePath).pipe(res);
      return;
    }
    res.statusCode = 404;
    res.end('Asset not found');
    return;
  }

  // Everything else -> Hono app.
  const request = new Request(`http://${req.headers.host}${rawUrl}`, {
    method: req.method,
    headers: req.headers as Record<string, string>,
  });
  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
});

server.listen(PORT, () => {
  console.log(`\n  API dev server running\n`);
  console.log(`  Swagger UI : http://localhost:${PORT}/api/v1/docs`);
  console.log(`  List       : http://localhost:${PORT}/api/v1/animes`);
  console.log(`  Detail     : http://localhost:${PORT}/api/v1/animes/ao-no-hako`);
  console.log(`  Filters    : http://localhost:${PORT}/api/v1/filters\n`);
});
