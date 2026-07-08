# Propuesta — exponer imágenes optimizadas (`images.thumb`) en la API

**Estado: implementado (2026-07-08).** Registrado el 2026-07-08 al detectar la
inconsistencia desde el consumidor `anime-notes` (autocompletado web).
Decisión abierta resuelta: los thumbs de `alternatives` **sí** se incluyeron en
la primera iteración, como `images.alternativesThumbs` (array paralelo a
`alternatives`, decisión del usuario). Nota de higiene: al implementar se
verificó que los 385 covers ya tenían thumb homónimo; solo hubo que borrar 6
thumbs huérfanos (versiones con extensión vieja, sin original ni referencia en
el dataset) — no hizo falta regenerar.

Sigue el estándar de verificación de `PROPOSALS.md`: extender
`api/_scripts/smoke-api.ts` con casos que fallan antes del cambio y pasan
después, y confirmar en un preview deploy.

---

## Inconsistencia actual (verificada 2026-07-08 en producción)

Los thumbnails **existen y se sirven** como assets estáticos, pero la API no
los expone ni los documenta:

- `GET /assets/AnimeImages_thumbs/Dandadan.jpeg` → `200 image/jpeg` (~58 KB
  vs ~qué tamaño tenga el cover completo). Se generan con
  `scripts/process_images.py` (ancho 400 px, calidad 75, mismo nombre de
  archivo que el original).
- El objeto `Anime` de la API solo trae `images.cover` y
  `images.alternatives` (`api/_lib/api-schema.ts:10-15`); el dataset
  `api/_data/animes.json` no guarda rutas de thumbs y `toApiAnime`
  (`api/_lib/data.ts:28-37`) no las construye.
- `llms.txt` y el spec OpenAPI no mencionan thumbnails.

Consecuencia: un consumidor solo puede *adivinar* la URL reemplazando
`/AnimeImages/` por `/AnimeImages_thumbs/`. Es un contrato no documentado y
frágil: hoy `src/assets/AnimeImages_thumbs/` tiene **391 archivos frente a
385 en `AnimeImages/`** — hay huérfanos con nombres/extensiones viejas (p. ej.
`2.5-jigen_no_Ririsa_1.jpeg` junto al actual `.jpg`), así que el swap ciego
puede devolver 404 o un thumb desactualizado.

## Objetivo

Que el cliente elija calidad sin adivinar rutas: **thumb optimizado** para
listas, grids y autocompletados; **cover en alta calidad** (el actual) para
detalle y guardado. Ambos como URLs absolutas listas para `<img>`.

## Diseño mínimo (consistente con el código existente)

```
GET /api/v1/animes?q=dan&fields=slug,title,images
→ { "data": [ { "slug": "dandadan",
                "images": { "cover": "…/AnimeImages/Dandadan.jpeg",
                            "thumb": "…/AnimeImages_thumbs/Dandadan.jpeg",
                            "alternatives": [ … ] } } ], … }
```

1. **Schema** — `api/_lib/api-schema.ts`: añadir `thumb: z.string().url()` al
   objeto `images` (`AnimeImages`). Al derivarse `ANIME_FIELDS` de las claves
   del schema, `fields=images` lo incluye sin más cambios; el OpenAPI se
   regenera solo vía `@hono/zod-openapi`.
2. **Construcción** — `api/_lib/data.ts` (`toApiAnime`): derivar la ruta del
   thumb desde `anime.images.cover` reemplazando el directorio
   (`assets/AnimeImages/` → `assets/AnimeImages_thumbs/`) y pasarla por el
   mismo `toUrl`. No hace falta tocar `animes.json`: el nombre de archivo es
   idéntico por diseño de `process_images.py`.
3. **Higiene de assets** (prerrequisito para que el punto 2 sea confiable):
   - Regenerar thumbs con `scripts/process_images.py` para cubrir los 385
     covers actuales.
   - Eliminar los ~6 thumbs huérfanos que ya no tienen original.
   - Añadir un chequeo (script o smoke test) de que **cada** cover tiene su
     thumb con nombre idéntico; correrlo antes del deploy.
4. **Documentación**: añadir `images.thumb` a `llms.txt` (sección del objeto
   Anime y recomendación de uso: thumb para listas/autocomplete, cover para
   detalle) y actualizar la guía del consumidor
   (`anime-notes/ANIME-CATALOG-API.md`).

Decisión abierta: ¿thumbs también para `alternatives`? Propuesta: no en la
primera iteración — ningún consumidor los lista hoy en miniatura; añadir
`alternativesThumbs` después si aparece el caso de uso.

## Verificación

- Smoke test nuevo: `images.thumb` es URL absoluta bajo
  `/assets/AnimeImages_thumbs/` y responde `200 image/*` (HEAD) para una
  muestra de slugs; falla antes del cambio (campo ausente) y pasa después.
- Chequeo de cobertura: 0 covers sin thumb, 0 thumbs huérfanos.
- Consumidores: `anime-notes` puede pedir `fields=slug,title,images` y pintar
  `images.thumb` en listas sin tocar nada más.
