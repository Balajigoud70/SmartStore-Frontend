import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http'; // 👈 కొత్తగా దీన్ని ఇంపోర్ట్ చేసాం బ్రదర్

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient() // 👈 మన యాంగులర్ కి బ్యాకెండ్‌తో మాట్లాడే పవర్ ఇచ్చాం బ్రదర్!
  ]
};