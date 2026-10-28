// Sube las portadas originales (src/assets/AnimeImages) al bucket R2 con
// `wrangler r2 bulk put`, en lotes pequeños: ese comando es experimental y
// se detiene al primer error 500, así que cada lote se reintenta solo.
// No ejecutes otro wrangler mientras corre: dos procesos renovando la sesión
// OAuth a la vez la invalidan.
//
// Uso (desde la raíz del repo, con `npx wrangler login` hecho):
//   node workers/r2-images/upload.mjs [desde-el-archivo]
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const WRANGLER = 'wrangler@4.150.0';
const BUCKET = 'anime-cover-catalog';
const BATCH = 25;
const RETRIES = 4;

const dir = resolve('src/assets/AnimeImages');
const from = process.argv[2] ?? '';
const files = readdirSync(dir).filter((f) => f >= from).sort();
const tmp = mkdtempSync(join(tmpdir(), 'r2-upload-'));
const typeOf = (f) => (f.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');

const failed = [];
for (let i = 0; i < files.length; i += BATCH) {
  for (const type of ['image/jpeg', 'image/webp']) {
    const chunk = files.slice(i, i + BATCH).filter((f) => typeOf(f) === type);
    if (!chunk.length) continue;
    const list = join(tmp, 'batch.json');
    writeFileSync(list, JSON.stringify(chunk.map((f) => ({ key: `AnimeImages/${f}`, file: join(dir, f) }))));
    let ok = false;
    for (let attempt = 1; attempt <= RETRIES && !ok; attempt++) {
      const run = spawnSync('npx', ['--yes', WRANGLER, 'r2', 'bulk', 'put', BUCKET, '--remote', '-f', list,
        '--ct', type, '--cc', '"public, max-age=604800"', '--concurrency', '5'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: true });
      // wrangler sale con 0 aunque falle un archivo: el error va en el texto.
      const out = `${run.stdout}\n${run.stderr}`;
      if (/not logged in|wrangler login|--temporary/i.test(out)) {
        console.error('Sesión de wrangler caducada: ejecuta `npx wrangler login` y relanza desde', chunk[0]);
        process.exit(2);
      }
      ok = run.status === 0 && /Uploaded 100%/.test(out) && !/ERROR/.test(out);
    }
    if (!ok) failed.push(...chunk);
  }
  console.log(`${Math.min(i + BATCH, files.length)}/${files.length} procesadas, ${failed.length} fallidas`);
}
console.log(failed.length ? `Fallaron ${failed.length}:\n${failed.join('\n')}` : 'Todo subido.');
process.exitCode = failed.length ? 1 : 0;
