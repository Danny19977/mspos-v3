import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { AuthGuard } from '../auth/guard/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.module').then(
            (m) => m.DashboardModule
          ),
          // canActivate: [AuthGuard]
      },

      // ///////////// TERRITOIRES //////////////////////////////////////////////////
      {
        path: '',
        loadChildren: () =>
          import('./territories/territories.module').then(
            (m) => m.TerritoriesModule
          ),
          // canActivate: [AuthGuard]
      },

      //  ///////////// TEAMS ///////////////////////////////////////////////
      {
        path: '',
        loadChildren: () =>
          import('./teams/teams.module').then(
            (m) => m.TeamsModule
          ),
          // canActivate: [AuthGuard]
      },

      // /////////////////// Market ////////////////////////////////////////////////
      {
        path: '',
        loadChildren: () =>
          import('./market/market.module').then(
            (m) => m.MarketModule
          ),
      },

      // ////////////// MANAGEMENT //////////////////////////////////////////////////////////
      {
        path: '',
        loadChildren: () =>
          import('./management/management.module').then(
            (m) => m.ManagementModule
          ),
          // canActivate: [AuthGuard]
      },
      {
        path: 'pages',
        loadChildren: () =>
          import('./pages/pages.module').then((m) => m.PagesModule),
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
