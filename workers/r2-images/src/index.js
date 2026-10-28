// Sirve en solo lectura las portadas originales del bucket R2 del catálogo.
// La ruta de la petición es la clave del objeto: /AnimeImages/<archivo>.
export default {
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const key = decodeURIComponent(new URL(request.url).pathname.slice(1));
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
