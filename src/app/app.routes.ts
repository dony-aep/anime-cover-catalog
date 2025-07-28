import { Routes } from '@angular/router';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';

export const routes: Routes = [
  {
    path: '',
    component: CatalogPageComponent
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
