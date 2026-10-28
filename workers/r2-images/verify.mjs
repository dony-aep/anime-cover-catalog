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

const head = async (url) => {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status < 500 || attempt === 3) return res;
    } catch (err) {
      if (attempt === 3) throw err;
    }
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
};

const bad = [];
for (let i = 0; i < files.length; i += 20) {
  await Promise.all(files.slice(i, i + 20).map(async (f) => {
    const res = await head(`${BASE}/${encodeURI(`AnimeImages/${f}`)}`);
    const size = Number(res.headers.get('content-length'));
    const local = join(dir, f);
    if (res.status !== 200) bad.push(`${res.status} ${f}`);
    else if (existsSync(local) && size !== statSync(local).size) bad.push(`tamaño ${size} != ${statSync(local).size} ${f}`);
  }));
}
console.log(`${files.length - bad.length}/${files.length} portadas del catálogo en R2`);
if (bad.length) console.log(bad.join('\n'));
process.exitCode = bad.length ? 1 : 0;
