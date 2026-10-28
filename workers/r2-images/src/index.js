// Sirve en solo lectura las portadas originales del bucket R2 del catálogo.
// La ruta de la petición es la clave del objeto: /AnimeImages/<archivo>.
// /manifest.json lista {archivo: tamaño} de todo el bucket en una sola
// respuesta, para que el CI no tenga que consultar cada portada.
export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const { pathname } = new URL(request.url);
    if (pathname === '/manifest.json') {
      return manifest(env);
    }

    const key = decodeURIComponent(pathname.slice(1));
    if (!key.startsWith('AnimeImages/')) {
      return new Response('Not Found', { status: 404 });
    }

    const object = await env.IMAGES.get(key, {
      onlyIf: request.headers,
      range: request.headers,
    });
    if (object === null) {
      return new Response('Not Found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('access-control-allow-origin', '*');
    headers.set('x-content-type-options', 'nosniff');

    // Sin cuerpo: la precondición (If-None-Match, etc.) se cumplió.
    if (!('body' in object)) {
      return new Response(null, { status: 304, headers });
    }
    // R2 rellena object.range aunque no se pida, así que se mira la cabecera.
    const partial = request.headers.has('range') && object.range;
    if (partial) {
      const { offset = 0, length = object.size - offset } = object.range;
      headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${object.size}`);
    }
    const status = partial ? 206 : 200;
    if (request.method === 'HEAD') {
      headers.set('content-length', String(object.size));
      return new Response(null, { status, headers });
    }
    return new Response(object.body, { status, headers });
  },
};

// R2 devuelve como mucho 1000 claves por llamada; se sigue el cursor.
async function manifest(env) {
  const files = {};
  let cursor;
  do {
    const page = await env.IMAGES.list({ prefix: 'AnimeImages/', cursor });
    for (const obj of page.objects) files[obj.key.slice('AnimeImages/'.length)] = obj.size;
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return Response.json(files, {
    headers: { 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
  });
}
