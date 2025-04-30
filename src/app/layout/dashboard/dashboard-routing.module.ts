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
import { NdTableViewAreaComponent } from './nd-dashboard/nd-table-view-area/nd-table-view-area.component';
import { NdTableViewSubareaComponent } from './nd-dashboard/nd-table-view-subarea/nd-table-view-subarea.component';
import { NdTableViewCommuneComponent } from './nd-dashboard/nd-table-view-commune/nd-table-view-commune.component';
import { NdTableViewProvinceComponent } from './nd-dashboard/nd-table-view-province/nd-table-view-province.component';

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
            path: 'area/:province_name',
            component: NdTableViewAreaComponent,
          },
          {
            path: 'subarea/:area_name',
            component: NdTableViewSubareaComponent,
          },
          {
            path: 'commune/:subarea_name',
            component: NdTableViewCommuneComponent,
          },
          {
            path: '',
            component: NdTableViewProvinceComponent
          }
        ]
      },
      

      {
        path: 'weighted-distribution',
        component: WdDashboardComponent,
      }, 
      {
        path: 'share-in-shop-handling',
        component: SishDashboardComponent,
      }, 
      {
        path: 'out-of-stock',
        component: OosDashboardComponent,
      }, 
      {
        path: 'share-of-stock',
        component: SosDashboardComponent,
      }, 
      {
        path: 'sales-evolution',
        component: SeDashboardComponent,
      },
      {
        path: 'google-maps',
        component: GoogleMapComponent,
      },
      { 
        path: 'key-performance-indicators',
        component: KpiDashboardComponent,
      }
    ],
  },
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
