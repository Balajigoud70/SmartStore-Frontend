import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // 👈 🎯 నీ ఫోల్డర్ లో ఉన్న 'app.ts' కి కరెక్ట్ లింక్ ఇగో ఇదే బ్రదర్!
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
}).catch(err => console.error(err));