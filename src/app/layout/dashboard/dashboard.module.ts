import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { SharedModule } from '../../shared/shared.index';
import { NdDashboardComponent } from './nd-dashboard/nd-dashboard.component';
import { WdDashboardComponent } from './wd-dashboard/wd-dashboard.component';
import { SishDashboardComponent } from './sish-dashboard/sish-dashboard.component';
import { OosDashboardComponent } from './oos-dashboard/oos-dashboard.component';
import { SosDashboardComponent } from './sos-dashboard/sos-dashboard.component';
import { SeDashboardComponent } from './se-dashboard/se-dashboard.component';
import { GoogleMapComponent } from './google-map/google-map.component'; 
import { GoogleMapsModule } from '@angular/google-maps';
import { MapCardComponent } from './google-map/map-card/map-card.component';
// Dashboard Services - Lazy loaded only when dashboard module is loaded
import { GoogleMapService } from './services/google-map.service';
import { KpiService } from './services/kpi.service';
import { NdService } from './services/nd.service';
import { WdService } from './services/wd.service';
import { SaleEvolutionService } from './services/sale-evolution.service';
import { SosService } from './services/sos.service';
import { SummaryService } from './services/summary.service';
import { SummaryDashboardService } from './services/summary-dashboard.service';
import { DataObservationsComponent } from './data-observations/data-observations.component';
import { ObservationService } from './services/observation.service';
import { SeTableViewProvinceComponent } from './se-dashboard/se-table-view-province/se-table-view-province.component';
import { SeTableViewAreaComponent } from './se-dashboard/se-table-view-area/se-table-view-area.component';
import { SeTableViewSubareaComponent } from './se-dashboard/se-table-view-subarea/se-table-view-subarea.component';
import { SeTableViewCommuneComponent } from './se-dashboard/se-table-view-commune/se-table-view-commune.component';
import { WsDashboardComponent } from './ws-dashboard/ws-dashboard.component';
import { WsService } from './services/ws.service';
import { SishService } from './services/sish.service';
import { KpiDashboardComponent } from './kpi-dashboard/kpi-dashboard.component';
import { KpiTableViewCountryComponent } from './kpi-dashboard/kpi-table-view-country/kpi-table-view-country.component';
import { KpiTableViewProvinceComponent } from './kpi-dashboard/kpi-table-view-province/kpi-table-view-province.component';
import { KpiTableViewAreaComponent } from './kpi-dashboard/kpi-table-view-area/kpi-table-view-area.component';
import { KpiTableViewSubareaComponent } from './kpi-dashboard/kpi-table-view-subarea/kpi-table-view-subarea.component';
import { KpiTableViewCommuneComponent } from './kpi-dashboard/kpi-table-view-commune/kpi-table-view-commune.component';
import { KpiUserVisitSummaryComponent } from './kpi-dashboard/kpi-user-visit-summary/kpi-user-visit-summary.component';

@NgModule({
  declarations: [
    DashboardComponent,
    NdDashboardComponent,
    WdDashboardComponent,
    SishDashboardComponent,
    OosDashboardComponent,
    SosDashboardComponent,
    SeDashboardComponent,
    GoogleMapComponent,
    MapCardComponent,
    DataObservationsComponent,
    SeTableViewProvinceComponent,
    SeTableViewAreaComponent,
    SeTableViewSubareaComponent,
    SeTableViewCommuneComponent,
    WsDashboardComponent,
    KpiDashboardComponent,
    KpiTableViewCountryComponent,
    KpiTableViewProvinceComponent,
    KpiTableViewAreaComponent,
    KpiTableViewSubareaComponent,
    KpiTableViewCommuneComponent,
    KpiUserVisitSummaryComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    DashboardRoutingModule,
    SharedModule,
    GoogleMapsModule
  ],
  providers: [
    // Dashboard services loaded only when this module is loaded
    GoogleMapService,
    KpiService,
    NdService,
    WdService,
    SaleEvolutionService,
    SosService,
    SummaryService,
    SummaryDashboardService,
    ObservationService,
    WsService,
    SishService,
  ]
})
export class DashboardModule { }
