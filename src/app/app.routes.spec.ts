import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { CatalogPageComponent } from './pages/catalog-page/catalog-page.component';

describe('routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    });
  });

  it('reutiliza la misma página de catálogo al pasar de la portada a un filtro', async () => {
    const harness = await RouterTestingHarness.create();
    const home = await harness.navigateByUrl('/', CatalogPageComponent);
    const filtered = await harness.navigateByUrl('/catalog/genre/romance', CatalogPageComponent);

    expect(filtered).toBe(home);
  });
});
