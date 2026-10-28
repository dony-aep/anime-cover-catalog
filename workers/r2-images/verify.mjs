// Comprueba que cada portada que referencia api/_data/animes.json está en R2.
// Pide al Worker el listado del bucket (/manifest.json) en una sola petición
// y lo compara con el dataset; si existe la copia local en
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
// timeout del paso; cada intento corta a los 30 s y se reintenta.
let bucket;
for (let attempt = 1; !bucket; attempt++) {
  try {
    const res = await fetch(`${BASE}/manifest.json`, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    bucket = await res.json();
  } catch (err) {
    if (attempt === 3) {
      console.error(`No se pudo leer ${BASE}/manifest.json: ${err.message}`);
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

const bad = [];
for (const f of files) {
  const local = join(dir, f);
  if (!(f in bucket)) bad.push(`falta en R2: ${f}`);
  else if (existsSync(local) && bucket[f] !== statSync(local).size) {
    bad.push(`tamaño ${bucket[f]} != ${statSync(local).size}: ${f}`);
  }
}
console.log(`${files.length - bad.length}/${files.length} portadas del catálogo en R2 (el bucket tiene ${Object.keys(bucket).length})`);
if (bad.length) console.log(bad.join('\n'));
process.exitCode = bad.length ? 1 : 0;
