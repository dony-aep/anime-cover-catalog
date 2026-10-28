// Comprueba que cada portada que referencia api/_data/animes.json está en R2,
// pidiéndola al Worker con HEAD. Si existe la copia local en
// src/assets/AnimeImages, además compara el tamaño. Lo usa el CI, donde las
// originales no están en el repo.
//
// Uso (desde la raíz del repo): node workers/r2-images/verify.mjs [url-del-worker]
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASE = (process.argv[2] ?? process.env.IMAGES_BASE_URL ?? 'https://anime-cover-catalog-images.r2-images.workers.dev')
  .replace(/\/+$/, '');
const dir = resolve('src/assets/AnimeImages');
const animes = JSON.parse(readFileSync(resolve('api/_data/animes.json'), 'utf8'));
const files = [...new Set(animes.flatMap((a) => [a.images.cover, ...a.images.alternatives]).map((p) => p.split('/').pop()))];

// Sin límite, una conexión que no responde deja el CI esperando hasta el
// timeout del job; cada intento corta a los 15 s y se reintenta.
const TIMEOUT_MS = 15_000;
const ATTEMPTS = 3;
const CONCURRENCY = 10;

const head = async (url) => {
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (res.status < 500) return res;
      last = `HTTP ${res.status}`;
    } catch (err) {
      last = err.name === 'TimeoutError' ? `sin respuesta en ${TIMEOUT_MS / 1000} s` : err.message;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return { status: last, headers: new Headers() };
};

const bad = [];
for (let i = 0; i < files.length; i += CONCURRENCY) {
  await Promise.all(files.slice(i, i + CONCURRENCY).map(async (f) => {
    const res = await head(`${BASE}/${encodeURI(`AnimeImages/${f}`)}`);
    const size = Number(res.headers.get('content-length'));
    const local = join(dir, f);
    if (res.status !== 200) bad.push(`${res.status} ${f}`);
    else if (existsSync(local) && size !== statSync(local).size) bad.push(`tamaño ${size} != ${statSync(local).size} ${f}`);
  }));
  const done = Math.min(i + CONCURRENCY, files.length);
  if (done % 200 < CONCURRENCY || done === files.length) console.log(`${done}/${files.length} revisadas`);
}
console.log(`${files.length - bad.length}/${files.length} portadas del catálogo en R2`);
if (bad.length) console.log(bad.join('\n'));
process.exitCode = bad.length ? 1 : 0;
