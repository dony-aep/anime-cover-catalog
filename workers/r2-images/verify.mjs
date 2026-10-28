// Comprueba que cada portada de src/assets/AnimeImages está en R2 con el mismo
// tamaño, pidiéndola al Worker con HEAD. Lista las que faltan o difieren.
//
// Uso (desde la raíz del repo): node workers/r2-images/verify.mjs [url-del-worker]
import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASE = (process.argv[2] ?? 'https://anime-cover-catalog-images.r2-images.workers.dev').replace(/\/+$/, '');
const dir = resolve('src/assets/AnimeImages');
const files = readdirSync(dir).sort();

const bad = [];
for (let i = 0; i < files.length; i += 20) {
  await Promise.all(files.slice(i, i + 20).map(async (f) => {
    const res = await fetch(`${BASE}/${encodeURI(`AnimeImages/${f}`)}`, { method: 'HEAD' });
    const size = Number(res.headers.get('content-length'));
    if (res.status !== 200 || size !== statSync(join(dir, f)).size) bad.push(`${res.status} ${size} ${f}`);
  }));
}
console.log(`${files.length - bad.length}/${files.length} correctas`);
if (bad.length) console.log(bad.join('\n'));
process.exitCode = bad.length ? 1 : 0;
