import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Sync Components (Standalone)
import { SyncStatusComponent } from '../../shared/components/sync-status/sync-status.component';
import { RecordSyncBadgeComponent } from '../../shared/components/record-sync-badge/record-sync-badge.component';

// Components
import { PosVenteListComponent } from './pos-vente/pos-vente-list/pos-vente-list.component';
import { PosViewComponent } from './pos-vente/pos-view/pos-view.component';
import { PosEquipmentComponent } from './pos-vente/pos-equipment/pos-equipment.component';
import { RouteplanComponent } from './routeplan/routeplan.component';
import { BrandComponent } from './brand/brand.component';
import { MapPosComponent } from './pos-vente/pos-view/map-pos/map-pos.component';
import { PosformsComponent } from './pos-vente/pos-view/posforms/posforms.component';

// Services - Lazy loaded only when module is loaded
import { PosVenteService } from './pos-vente/pos-vente.service';
import { RouteplanService } from './routeplan/routeplan.service';
import { RouteplanItemService } from './routeplan/routeplanitem.service';
import { BrandService } from './brand/brand.service';

// Offline/Sync Services
import { NetworkService } from '../../services/network.service';
import { SyncQueueService } from '../../shared/services/sync-queue.service';
import { OfflineService } from '../../shared/services/offline.service';
import { DataSyncService } from '../../shared/services/data-sync.service';
import { AutoSyncService } from '../../shared/services/auto-sync.service';

import { MapPosCardComponent } from './pos-vente/pos-view/map-pos/map-pos-card/map-pos-card.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';
import { PosFilterListComponent } from './pos-vente/pos-filter-list/pos-filter-list.component';
import { BrandFilterListComponent } from './brand/brand-filter-list/brand-filter-list.component';
import { MarketRoutingModule } from './market-routing.module';
import { PosformFilterComponent } from './posform/posform-filter/posform-filter.component';
import { PostformListComponent } from './posform/postform-list/postform-list.component';

@NgModule({
  declarations: [
    // Non-standalone components only
    RouteplanComponent,
    BrandComponent,
    BrandFilterListComponent,
     PostformListComponent,
    PosformFilterComponent, 
  ],
  imports: [
    CommonModule,
    MarketRoutingModule,
    SharedModule,
    // RouterModule.forChild(routes),
    GoogleMapsModule,
    // Standalone components
    SyncStatusComponent,
    RecordSyncBadgeComponent,

    PosVenteListComponent,
    PosViewComponent,
    PosEquipmentComponent,
    MapPosComponent,
    PosformsComponent,
    MapPosCardComponent,
    PosFilterListComponent,
  ],
  providers: [
    // Business Services - Déjà providedIn:'root', mais on les garde ici pour la cohérence
    GoogleMapsLoaderService,
    RouteplanItemService,
    
    // Les services offline/sync sont déjà providedIn:'root'
  ]
})
export class MarketModule {
  constructor(private autoSyncService: AutoSyncService) {
    // Démarrer la synchronisation automatique au chargement du module
    this.autoSyncService.start();
    console.log('🚀 MarketModule: Services offline/online initialisés');
  }
}

