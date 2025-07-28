import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { inject } from '@vercel/analytics';

// Analytics (sólo en cliente; no se ejecuta en SSR).
inject();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
