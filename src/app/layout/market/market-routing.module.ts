import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { PosVenteListComponent } from './pos-vente/pos-vente-list/pos-vente-list.component';
import { PosViewComponent } from './pos-vente/pos-view/pos-view.component';
import { PosEquipmentComponent } from './pos-vente/pos-equipment/pos-equipment.component';
import { RouteplanComponent } from './routeplan/routeplan.component';
import { BrandComponent } from './brand/brand.component';
import { PosFilterListComponent } from './pos-vente/pos-filter-list/pos-filter-list.component';
import { BrandFilterListComponent } from './brand/brand-filter-list/brand-filter-list.component';
import { PostformListComponent } from './posform/postform-list/postform-list.component';
import { PosformFilterComponent } from './posform/posform-filter/posform-filter.component';
import { NdIndividualComponent } from './nd-individual/nd-individual.component';

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
    path: 'posforms/pos-form-list',
    component: PostformListComponent,
  },
  {
    path: 'posforms/pos-form-filter/:name/:uuid',
    component: PosformFilterComponent,
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
    path: 'brands-filter/:name/:uuid',
    component: BrandFilterListComponent,
  },
  {
    path: 'nd-individual',
    component: NdIndividualComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarketRoutingModule { }