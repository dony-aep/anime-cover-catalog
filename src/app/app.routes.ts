import { Routes } from '@angular/router';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';
import { FavoritesPageComponent } from './pages/favorites-page/favorites-page.component';
import { ApiDocsPageComponent } from './pages/api-docs-page/api-docs-page.component';

export const routes: Routes = [
  {
    path: '',
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
    path: 'catalog/:type/:value',
    component: CatalogPageComponent
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
