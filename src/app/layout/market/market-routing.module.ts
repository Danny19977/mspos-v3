import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { PosVenteListComponent } from './pos-vente/pos-vente-list/pos-vente-list.component';
import { PosViewComponent } from './pos-vente/pos-view/pos-view.component';
import { PosEquipmentComponent } from './pos-vente/pos-equipment/pos-equipment.component';
import { RouteplanComponent } from './routeplan/routeplan.component';
import { BrandComponent } from './brand/brand.component'; 
import { PosFilterListComponent } from './pos-vente/pos-filter-list/pos-filter-list.component';
import { BrandFilterListComponent } from './brand/brand-filter-list/brand-filter-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'pos/pos-list',
    pathMatch: 'full',
  },
  {
    path: 'pos/pos-list',
    component: PosVenteListComponent,
  },
  {
    path: 'pos/pos-filter/:name/:uuid',
    component: PosFilterListComponent,
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
  },
  {
    path: 'brands/list/:name/:uuid',
    component: BrandFilterListComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarketRoutingModule { }