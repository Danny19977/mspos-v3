import { NgModule, isDevMode, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideToastr, ToastrModule } from 'ngx-toastr';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

import { SharedModule } from './shared/shared.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CredentialInterceptor } from './auth/interceptors/credential.interceptor';

// Core services uniquement (chargés au démarrage)
import { AuthService } from './auth/auth.service';

// Enregistrer la locale française
registerLocaleData(localeFr);

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    
    // Service Worker optimisé - Activé uniquement en production pour les performances
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(), // Production seulement
      // Enregistrer le ServiceWorker quand l'application est stable
      // ou après 15 secondes (au lieu de 30) pour un démarrage plus rapide
      registrationStrategy: 'registerWhenStable:15000'
    }),

    SharedModule,
    BrowserAnimationsModule,
    
    // Configuration Toastr optimisée
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      countDuplicates: true,
      resetTimeoutOnDuplicate: true,
      includeTitleDuplicates: true,
      maxOpened: 3,
      autoDismiss: true,
      newestOnTop: true,
      closeButton: true,
      enableHtml: false,
      progressBar: true,
      progressAnimation: 'increasing',
      tapToDismiss: true
    })
  ],
  providers: [
    // Intercepteur HTTP
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialInterceptor,
      multi: true
    },
    
    // Configuration locale
    {
      provide: LOCALE_ID,
      useValue: 'fr-FR'
    },
    
    // Fournisseurs optimisés
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      maxOpened: 3
    }),

    // Services core uniquement - les autres services seront chargés à la demande
    AuthService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { 
  constructor() {
    // Log de performance pour le démarrage du module
    console.log('🚀 AppModule initialisé');
  }
}
