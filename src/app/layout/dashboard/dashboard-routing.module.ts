import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DealsDashboardComponent } from './deals-dashboard/deals-dashboard.component';
 
import { MsposDashboardComponent } from './mspos-dashboard/mspos-dashboard.component';
import { NdDashboardComponent } from './nd-dashboard/nd-dashboard.component';
import { WdDashboardComponent } from './wd-dashboard/wd-dashboard.component';
import { SishDashboardComponent } from './sish-dashboard/sish-dashboard.component';
import { OosDashboardComponent } from './oos-dashboard/oos-dashboard.component';
import { SosDashboardComponent } from './sos-dashboard/sos-dashboard.component';
import { SeDashboardComponent } from './se-dashboard/se-dashboard.component';
import { GoogleMapComponent } from './google-map/google-map.component';
import { KpiDashboardComponent } from './kpi-dashboard/kpi-dashboard.component';
import { SummaryDashboardComponent } from './summary-dashboard/summary-dashboard.component';
import { DataObservationsComponent } from './data-observations/data-observations.component';
import { NdTableViewAreaComponent } from './nd-dashboard/nd-table-view-area/nd-table-view-area.component';
import { NdTableViewSubareaComponent } from './nd-dashboard/nd-table-view-subarea/nd-table-view-subarea.component';
import { NdTableViewCommuneComponent } from './nd-dashboard/nd-table-view-commune/nd-table-view-commune.component';
import { NdTableViewProvinceComponent } from './nd-dashboard/nd-table-view-province/nd-table-view-province.component';
import { SosTableViewProvinceComponent } from './sos-dashboard/sos-table-view-province/sos-table-view-province.component';
import { SosTableViewAreaComponent } from './sos-dashboard/sos-table-view-area/sos-table-view-area.component';
import { SosTableViewCommuneComponent } from './sos-dashboard/sos-table-view-commune/sos-table-view-commune.component';
import { SosTableViewSubareaComponent } from './sos-dashboard/sos-table-view-subarea/sos-table-view-subarea.component';
import { OosTableViewProvinceComponent } from './oos-dashboard/oos-table-view-province/oos-table-view-province.component';
import { OosTableViewAreaComponent } from './oos-dashboard/oos-table-view-area/oos-table-view-area.component';
import { OosTableViewSubareaComponent } from './oos-dashboard/oos-table-view-subarea/oos-table-view-subarea.component';
import { OosTableViewCommuneComponent } from './oos-dashboard/oos-table-view-commune/oos-table-view-commune.component';
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
        path: 'mspos-dashboard',
        component: MsposDashboardComponent,
      },
      {
        path: 'deals-dashboard',
        component: DealsDashboardComponent,
      }, 
      {
        path: 'numeric-distribution',
        component: NdDashboardComponent,
        children: [
          {
            path: 'province/:country',
            component: NdTableViewProvinceComponent,
          },
          {
            path: 'area/:province_uuid',
            component: NdTableViewAreaComponent,
          },
          {
            path: 'subarea/:area_uuid',
            component: NdTableViewSubareaComponent,
          },
          {
            path: 'commune/:subarea_uuid',
            component: NdTableViewCommuneComponent,
          },
          {
            path: '',
            component: NdTableViewProvinceComponent
          }
        ]
      },
      {
        path: 'share-of-stock',
        component: SosDashboardComponent,
        children: [
          {
            path: 'province/:country',
            component: SosTableViewProvinceComponent,
          },
          {
            path: 'area/:province_uuid',
            component: SosTableViewAreaComponent,
          },
          {
            path: 'subarea/:area_uuid',
            component: SosTableViewSubareaComponent,
          },
          {
            path: 'commune/:subarea_uuid',
            component: SosTableViewCommuneComponent,
          },
          {
            path: '',
            component: SosTableViewProvinceComponent
          }
        ]
      },
      {
        path: 'out-of-stock',
        component: OosDashboardComponent,
        children: [
          {
            path: 'province/:country',
            component: OosTableViewProvinceComponent,
          },
          {
            path: 'area/:province_uuid',
            component: OosTableViewAreaComponent,
          },
          {
            path: 'subarea/:area_uuid',
            component: OosTableViewSubareaComponent,
          },
          {
            path: 'commune/:subarea_uuid',
            component: OosTableViewCommuneComponent,
          },
          {
            path: '',
            component: OosTableViewProvinceComponent
          }
        ]
      },  
      {
        path: 'sales-evolution',
        component: SeDashboardComponent,
        children: []
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
        children: []
      }, 

      {
        path: 'weighted-distribution',
        component: WdDashboardComponent,
      },   
      {
        path: 'google-maps',
        component: GoogleMapComponent,
      },
      {
        path: 'summary',
        component: SummaryDashboardComponent,
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
