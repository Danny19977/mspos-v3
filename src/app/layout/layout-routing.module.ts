import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ProfileComponent } from './profile/profile.component';
import { AreaListComponent } from './areas/area-list/area-list.component';
import { PosVenteListComponent } from './pos-vente/pos-vente-list/pos-vente-list.component';
import { SupListComponent } from './sups/sup-list/sup-list.component';
import { AsmListComponent } from './asm/asm-list/asm-list.component';
import { ManagerListComponent } from './managers/manager-list/manager-list.component';
import { CountryComponent } from './country/country.component';
import { SubareaComponent } from './subarea/subarea.component';
import { CycloComponent } from './cyclo/cyclo.component';
import { DrComponent } from './dr/dr.component';
import { CommuneComponent } from './commune/commune.component';
import { RouteplanComponent } from './routeplan/routeplan.component';
import { BrandComponent } from './brand/brand.component';
import { PosEquipmentComponent } from './pos-vente/pos-equipment/pos-equipment.component';
import { AuthGuard } from '../auth/guard/auth.guard';
import { PosViewComponent } from './pos-vente/pos-view/pos-view.component';

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
          canActivate: [AuthGuard]
      },

// ///////////// TERRITOIRES //////////////////////////////////////////////////
      {
        path: 'countries/country-list',
        component: CountryComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'provinces',
        loadChildren: () =>
          import('./province/province.module').then(
            (m) => m.ProvinceModule,
          ),
          canActivate: [AuthGuard]
      },
      {
        path: 'areas/area-list',
        component: AreaListComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'subareas/subarea-list',
        component: SubareaComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'communes/commune-list',
        component: CommuneComponent,
        canActivate: [AuthGuard]
      },

      //  ///////////// TEAMS ///////////////////////////////////////////////
      {
        path: 'asm/asm-list',
        component: AsmListComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'supervisors/sup-list',
        component: SupListComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'drs/dr-list',
        component: DrComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'cyclos/cyclo-list',
        component: CycloComponent,
        canActivate: [AuthGuard]
      },

      // /////////////////// Market ////////////////////////////////////////////////
      {
        path: 'pos/pos-list',
        component: PosVenteListComponent, 
      },
      {
        path: 'pos/pos-view/:uuid/posforms',
        component: PosViewComponent,
      },
      {
        path: 'pos/equipement/:uuid',
        component: PosEquipmentComponent,
      },
      {
        path: 'posforms',
        loadChildren: () =>
          import('./posform/pos.module').then(
            (m) => m.PosModule
          ),
      },
      { 
        path: 'route-plans/list',
        component: RouteplanComponent
      },
      { 
        path: 'brands/list',
        component: BrandComponent,
        canActivate: [AuthGuard]
      },

      // ////////////// MANAGEMENT //////////////////////////////////////////////////////////
      {
        path: 'managers/manager-list',
        component: ManagerListComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./user/user.module').then(
            (m) => m.UserModule
          ),
          canActivate: [AuthGuard]
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'users-logs/activity',
        loadChildren: () =>
          import('./user-logs/user-logs.module').then(
            (m) => m.UserLogsModule
          ),
          canActivate: [AuthGuard]
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
