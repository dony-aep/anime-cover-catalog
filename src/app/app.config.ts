import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideLucideConfig } from '@lucide/angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    // Trazo algo más fino que el 2 por defecto: a 16-20 px queda más cerca del peso del texto
    provideLucideConfig({ strokeWidth: 1.75 })
  ]
};
