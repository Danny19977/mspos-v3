import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { PosVenteListComponent } from '../pos-vente/pos-vente-list/pos-vente-list.component';
import { PosViewComponent } from '../pos-vente/pos-view/pos-view.component';
import { PosEquipmentComponent } from '../pos-vente/pos-equipment/pos-equipment.component';
import { RouteplanComponent } from '../routeplan/routeplan.component';
import { BrandComponent } from '../brand/brand.component';
import { MapPosComponent } from '../pos-vente/pos-view/map-pos/map-pos.component';
import { PosformsComponent } from '../pos-vente/pos-view/posforms/posforms.component';

// Services - Lazy loaded only when module is loaded
import { PosVenteService } from '../pos-vente/pos-vente.service';
import { RouteplanService } from '../routeplan/routeplan.service';
import { RouteplanItemService } from '../routeplan/routeplanitem.service';
import { BrandService } from '../brand/brand.service';
import { MapPosCardComponent } from '../pos-vente/pos-view/map-pos/map-pos-card/map-pos-card.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';

const routes: Routes = [
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
      import('../posform/pos.module').then(
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
];

@NgModule({
  declarations: [
    PosVenteListComponent,
    PosViewComponent,
    PosEquipmentComponent,
    RouteplanComponent,
    BrandComponent,
    MapPosComponent,
    PosformsComponent,
    MapPosCardComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    GoogleMapsModule,
  ],
  providers: [
    PosVenteService,
    RouteplanService,
    RouteplanItemService,
    BrandService,
    GoogleMapsLoaderService,
  ]
})
export class MarketModule { }
