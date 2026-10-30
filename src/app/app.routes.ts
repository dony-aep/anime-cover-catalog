import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { FavoritesPageComponent } from './pages/favorites-page/favorites-page.component';
import { ApiDocsPageComponent } from './pages/api-docs-page/api-docs-page.component';

/**
 * Matches both `/` and `/catalog/:type/:value` with a single route config, so
 * the router reuses the catalog page when only the filter changes instead of
 * rebuilding the whole gallery.
 */
export function catalogMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 0) {
    return { consumed: [] };
  }
  if (segments.length === 3 && segments[0].path === 'catalog') {
    return { consumed: segments, posParams: { type: segments[1], value: segments[2] } };
  }
  return null;
}

export const routes: Routes = [
  {
    matcher: catalogMatcher,
    component: CatalogPageComponent
  },
  {
    path: 'favorites',
    component: FavoritesPageComponent
  },
  {
    path: 'docs',
    component: ApiDocsPageComponent
  },
  {
    path: 'catalog',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
