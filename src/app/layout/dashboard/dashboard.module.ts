import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { DealsDashboardComponent } from './deals-dashboard/deals-dashboard.component';
import { SharedModule } from '../../shared/shared.index';
import { MsposDashboardComponent } from './mspos-dashboard/mspos-dashboard.component';
import { NdDashboardComponent } from './nd-dashboard/nd-dashboard.component';
import { WdDashboardComponent } from './wd-dashboard/wd-dashboard.component';
import { SishDashboardComponent } from './sish-dashboard/sish-dashboard.component';
import { OosDashboardComponent } from './oos-dashboard/oos-dashboard.component';
import { SosDashboardComponent } from './sos-dashboard/sos-dashboard.component';
import { SeDashboardComponent } from './se-dashboard/se-dashboard.component';
import { NdTableViewComponent } from './nd-dashboard/nd-table-view-province/nd-table-view/nd-table-view.component';
import { NdByYearComponent } from './nd-dashboard/nd-by-year/nd-by-year.component';
import { TrackingDrComponent } from './mspos-dashboard/tracking-dr/tracking-dr.component';
import { SumaryChartBarComponent } from './mspos-dashboard/sumary-chart-bar/sumary-chart-bar.component';
import { MapAreaComponent } from './mspos-dashboard/map-area/map-area.component';
import { StatsTotalComponent } from './mspos-dashboard/stats-total/stats-total.component';
import { SosPieComponent } from './mspos-dashboard/sos-pie/sos-pie.component';
import { BetterDrComponent } from './mspos-dashboard/better-dr/better-dr.component';
import { BetterSupComponent } from './mspos-dashboard/better-sup/better-sup.component';
import { StatusEquipementsComponent } from './mspos-dashboard/status-equipements/status-equipements.component';
import { GoogleMapComponent } from './google-map/google-map.component'; 
import { GoogleMapsModule } from '@angular/google-maps';
import { MapCardComponent } from './google-map/map-card/map-card.component';
import { PriceSaleComponent } from './mspos-dashboard/price-sale/price-sale.component';
import { KpiDashboardComponent } from './kpi-dashboard/kpi-dashboard.component';
import { NdTableViewAreaComponent } from './nd-dashboard/nd-table-view-area/nd-table-view-area.component';
import { NdTableViewSubareaComponent } from './nd-dashboard/nd-table-view-subarea/nd-table-view-subarea.component';
import { NdTableViewCommuneComponent } from './nd-dashboard/nd-table-view-commune/nd-table-view-commune.component';
import { NdTableViewProvinceComponent } from './nd-dashboard/nd-table-view-province/nd-table-view-province.component';
import { SosTableViewProvinceComponent } from './sos-dashboard/sos-table-view-province/sos-table-view-province.component';
import { SosTableViewAreaComponent } from './sos-dashboard/sos-table-view-area/sos-table-view-area.component';
import { SosTableViewSubareaComponent } from './sos-dashboard/sos-table-view-subarea/sos-table-view-subarea.component';
import { SosTableViewCommuneComponent } from './sos-dashboard/sos-table-view-commune/sos-table-view-commune.component';
import { SosChartLineComponent } from './sos-dashboard/sos-chart-line/sos-chart-line.component';
import { OosByYearComponent } from './oos-dashboard/oos-by-year/oos-by-year.component';
import { OosTableViewCommuneComponent } from './oos-dashboard/oos-table-view-commune/oos-table-view-commune.component';
import { OosTableViewSubareaComponent } from './oos-dashboard/oos-table-view-subarea/oos-table-view-subarea.component';
import { OosTableViewAreaComponent } from './oos-dashboard/oos-table-view-area/oos-table-view-area.component';
import { OosTableViewProvinceComponent } from './oos-dashboard/oos-table-view-province/oos-table-view-province.component';
import { SeTableViewProvinceComponent } from './se-dashboard/se-table-view-province/se-table-view-province.component';
import { SeTableViewAreaComponent } from './se-dashboard/se-table-view-area/se-table-view-area.component';
import { SeTableViewSubareaComponent } from './se-dashboard/se-table-view-subarea/se-table-view-subarea.component';
import { SeTableViewCommuneComponent } from './se-dashboard/se-table-view-commune/se-table-view-commune.component';
import { KpiTableViewAreaComponent } from './kpi-dashboard/kpi-table-view-area/kpi-table-view-area.component';
import { KpiTableViewCommuneComponent } from './kpi-dashboard/kpi-table-view-commune/kpi-table-view-commune.component';
import { KpiTableViewProvinceComponent } from './kpi-dashboard/kpi-table-view-province/kpi-table-view-province.component';
import { KpiTableViewSubareaComponent } from './kpi-dashboard/kpi-table-view-subarea/kpi-table-view-subarea.component'; 



@NgModule({
  declarations: [
    DashboardComponent,
    DealsDashboardComponent,
    MsposDashboardComponent,
    NdDashboardComponent,
    WdDashboardComponent,
    SishDashboardComponent,
    OosDashboardComponent,
    SosDashboardComponent,
    SeDashboardComponent,
    NdTableViewComponent,
    NdByYearComponent,
    TrackingDrComponent,
    SumaryChartBarComponent,
    MapAreaComponent,
    StatsTotalComponent,
    SosPieComponent,
    BetterDrComponent,
    BetterSupComponent,
    StatusEquipementsComponent,
    GoogleMapComponent,
    MapCardComponent,
    PriceSaleComponent,
    KpiDashboardComponent,
    NdTableViewAreaComponent,
    NdTableViewSubareaComponent,
    NdTableViewCommuneComponent,
    NdTableViewProvinceComponent,
    SosTableViewProvinceComponent,
    SosTableViewAreaComponent,
    SosTableViewSubareaComponent,
    SosTableViewCommuneComponent,
    SosChartLineComponent,
    OosByYearComponent,
    OosTableViewCommuneComponent,
    OosTableViewSubareaComponent,
    OosTableViewAreaComponent,
    OosTableViewProvinceComponent,
    SeTableViewProvinceComponent,
    SeTableViewAreaComponent,
    SeTableViewSubareaComponent,
    SeTableViewCommuneComponent,
    KpiTableViewAreaComponent,
    KpiTableViewCommuneComponent,
    KpiTableViewProvinceComponent,
    KpiTableViewSubareaComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    GoogleMapsModule
  ]
})
export class DashboardModule { }
