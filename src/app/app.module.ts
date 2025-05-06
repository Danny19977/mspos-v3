import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr, ToastrModule } from 'ngx-toastr';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

import { SharedModule } from './shared/shared.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CredentialInterceptor } from './auth/interceptors/credential.interceptor';
import { AuthService } from './auth/auth.service';
import { AsmService } from './layout/asm/asm.service';
import { BrandService } from './layout/brand/brand.service';
import { CommuneService } from './layout/commune/commune.service';
import { CountryService } from './layout/country/country.service';
import { CycloService } from './layout/cyclo/cyclo.service';
import { GoogleMapService } from './layout/dashboard/services/google-map.service';
import { KpiService } from './layout/dashboard/services/kpi.service';
import { NdService } from './layout/dashboard/services/nd.service';
import { SaleEvolutionService } from './layout/dashboard/services/sale-evolution.service';
import { SosService } from './layout/dashboard/services/sos.service';
import { SummaryService } from './layout/dashboard/services/summary.service';
import { DrService } from './layout/dr/dr.service';
import { ManagerService } from './layout/managers/manager.service';
import { PosVenteService } from './layout/pos-vente/pos-vente.service';
import { PosformService } from './layout/posform/posform.service';
import { RouteplanItemService } from './layout/routeplan/routeplanitem.service';
import { RouteplanService } from './layout/routeplan/routeplan.service';
import { SubareaService } from './layout/subarea/subarea.service';
import { SupService } from './layout/sups/sup.service';
import { UserService } from './layout/user/user.service';
import { LogsService } from './layout/user-logs/logs.service';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),

    SharedModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(), 
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CredentialInterceptor,
      multi: true
    },
    provideAnimations(), // required animations providers
    provideToastr(), // Toastr providers

    AuthService,
    AsmService,
    BrandService,
    CommuneService,
    CountryService,
    CycloService,
    GoogleMapService,
    KpiService,
    NdService,
    SaleEvolutionService,
    SosService,
    SummaryService,
    DrService,
    ManagerService,
    PosVenteService,
    PosformService,
    RouteplanService,
    RouteplanItemService,
    SubareaService,
    SupService,
    UserService,
    LogsService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
