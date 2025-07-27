import { Routes } from '@angular/router';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';

export const routes: Routes = [
  { 
    path: 'catalog', 
    component: CatalogPageComponent 
  },
  { 
    path: 'catalog/:type/:value', 
    component: CatalogPageComponent 
  },
  { 
    path: '', 
    redirectTo: '/catalog', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: '/catalog' 
  }
];
