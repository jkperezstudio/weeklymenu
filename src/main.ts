import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core'; // Importante
import { IonicModule } from '@ionic/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app/app.component';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy } from '@ionic/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';
import { routes } from './app/app.routes';
import { addIcons } from 'ionicons';
import { imagesOutline, cameraOutline, close, add, trash, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';



addIcons({
  'images-outline': imagesOutline, cameraOutline, close, trash, add, chevronBackOutline, chevronForwardOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(IonicModule.forRoot()),
    // Estrategia de rutas para Ionic
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },

    // Proveedores varios
    provideHttpClient(),
    provideAnimations(),
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() => getFirestore()),

    // Aquí el truco principal: usar importProvidersFrom para IonicModule
    importProvidersFrom(
      IonicModule.forRoot() // Puedes pasarle config si quieres
    )
  ]
}).catch(err => console.error(err));
