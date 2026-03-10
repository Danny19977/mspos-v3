import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
 
import { NdDashboardComponent } from './nd-dashboard/nd-dashboard.component';
import { WdDashboardComponent } from './wd-dashboard/wd-dashboard.component';
import { WsDashboardComponent } from './ws-dashboard/ws-dashboard.component';
import { SishDashboardComponent } from './sish-dashboard/sish-dashboard.component';
import { OosDashboardComponent } from './oos-dashboard/oos-dashboard.component';
import { SosDashboardComponent } from './sos-dashboard/sos-dashboard.component';
import { SeDashboardComponent } from './se-dashboard/se-dashboard.component';
import { GoogleMapComponent } from './google-map/google-map.component';
import { KpiDashboardComponent } from './kpi-dashboard/kpi-dashboard.component'; 
import { DataObservationsComponent } from './data-observations/data-observations.component'; 
import { KpiTableViewProvinceComponent } from './kpi-dashboard/kpi-table-view-province/kpi-table-view-province.component';
import { KpiTableViewAreaComponent } from './kpi-dashboard/kpi-table-view-area/kpi-table-view-area.component';
import { KpiTableViewCommuneComponent } from './kpi-dashboard/kpi-table-view-commune/kpi-table-view-commune.component';
import { KpiTableViewSubareaComponent } from './kpi-dashboard/kpi-table-view-subarea/kpi-table-view-subarea.component'; 
import { KpiTableViewCountryComponent } from './kpi-dashboard/kpi-table-view-country/kpi-table-view-country.component';
import { KpiUserVisitSummaryComponent } from './kpi-dashboard/kpi-user-visit-summary/kpi-user-visit-summary.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'mspos-dashboard',
        pathMatch: 'full'
      },
      {
        path: 'numeric-distribution',
        component: NdDashboardComponent,
      },
      {
        path: 'share-of-stock',
        component: SosDashboardComponent,
      },
      {
        path: 'out-of-stock',
        component: OosDashboardComponent,
      },  
      {
        path: 'sales-evolution',
        component: SeDashboardComponent,
      },
      { 
        path: 'key-performance-indicators',
        component: KpiDashboardComponent,
        children: [
          {
            path: 'country/:country',
            component: KpiTableViewCountryComponent,
          },
          {
            path: 'province/:country',
            component: KpiTableViewProvinceComponent,
          },
          {
            path: 'area/:province_uuid',
            component: KpiTableViewAreaComponent,
          },
          {
            path: 'subarea/:area_uuid',
            component: KpiTableViewSubareaComponent,
          },
          {
            path: 'commune/:subarea_uuid',
            component: KpiTableViewCommuneComponent,
          },
          {
            path: 'user-summary',
            component: KpiUserVisitSummaryComponent,
          },
          {
            path: '',
            component: KpiTableViewProvinceComponent
          }
        ]
      },
      {
        path: 'share-in-shop-handling',
        component: SishDashboardComponent,
      },
      {
        path: 'weighted-distribution',
        component: WdDashboardComponent,
      },
      {
        path: 'weighted-sales',
        component: WsDashboardComponent,
      },   
      {
        path: 'google-maps',
        component: GoogleMapComponent,
      }, 
      {
        path: 'observations',
        component: DataObservationsComponent,
      },
      
    ],
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
