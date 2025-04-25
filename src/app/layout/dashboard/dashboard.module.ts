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
import { NdAverageAreaComponent } from './nd-dashboard/nd-average-area/nd-average-area.component';
import { NdPerformanceAreaComponent } from './nd-dashboard/nd-performance-area/nd-performance-area.component';
import { NdTableViewComponent } from './nd-dashboard/nd-table-view/nd-table-view.component';
import { NdByYearComponent } from './nd-dashboard/nd-by-year/nd-by-year.component';
import { TrackingDrComponent } from './mspos-dashboard/tracking-dr/tracking-dr.component';
import { SumaryChartBarComponent } from './mspos-dashboard/sumary-chart-bar/sumary-chart-bar.component';
import { MapAreaComponent } from './mspos-dashboard/map-area/map-area.component';
import { StatsTotalComponent } from './mspos-dashboard/stats-total/stats-total.component';
import { SosPieComponent } from './mspos-dashboard/sos-pie/sos-pie.component';
import { OosAverageAreaComponent } from './oos-dashboard/oos-average-area/oos-average-area.component';
import { OosByYearComponent } from './oos-dashboard/oos-by-year/oos-by-year.component';
import { OosPerformanceAreaComponent } from './oos-dashboard/oos-performance-area/oos-performance-area.component';
import { OosTableViewComponent } from './oos-dashboard/oos-table-view/oos-table-view.component';
import { SosPieChartComponent } from './sos-dashboard/sos-pie-chart/sos-pie-chart.component';
import { SosTableViewComponent } from './sos-dashboard/sos-table-view/sos-table-view.component';
import { SosByYearComponent } from './sos-dashboard/sos-by-year/sos-by-year.component';
import { SosChartBarComponent } from './sos-dashboard/sos-chart-bar/sos-chart-bar.component';
import { BetterDrComponent } from './mspos-dashboard/better-dr/better-dr.component';
import { BetterSupComponent } from './mspos-dashboard/better-sup/better-sup.component';
import { StatusEquipementsComponent } from './mspos-dashboard/status-equipements/status-equipements.component';
import { GoogleMapComponent } from './google-map/google-map.component'; 
import { GoogleMapsModule } from '@angular/google-maps';
import { MapCardComponent } from './google-map/map-card/map-card.component';
import { PriceSaleComponent } from './mspos-dashboard/price-sale/price-sale.component';



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
    NdAverageAreaComponent,
    NdPerformanceAreaComponent,
    NdTableViewComponent,
    NdByYearComponent,
    TrackingDrComponent,
    SumaryChartBarComponent,
    MapAreaComponent,
    StatsTotalComponent,
    SosPieComponent,
    OosAverageAreaComponent,
    OosByYearComponent,
    OosPerformanceAreaComponent,
    OosTableViewComponent,
    SosPieChartComponent,
    SosTableViewComponent,
    SosByYearComponent,
    SosChartBarComponent,
    BetterDrComponent,
    BetterSupComponent,
    StatusEquipementsComponent,
    GoogleMapComponent,
    MapCardComponent,
    PriceSaleComponent, 
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    GoogleMapsModule
  ]
})
export class DashboardModule { }
