import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { SharedModule } from '../shared/shared.module';

import { SidebarComponent } from './common/sidebar/sidebar.component';
import { HeaderComponent } from './common/header/header.component';
import { LayoutCommonComponent } from './common/layout-common/layout-common.component'; 

// Sync Components (Standalone)
import { SyncStatusComponent } from '../shared/components/sync-status/sync-status.component';
import { RecordSyncBadgeComponent } from '../shared/components/record-sync-badge/record-sync-badge.component';

@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    LayoutCommonComponent,
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    SharedModule,
    // Standalone sync components
    SyncStatusComponent,
    RecordSyncBadgeComponent,
  ],
  exports: [
    SyncStatusComponent,
    RecordSyncBadgeComponent,
  ]
})
export class LayoutModule { }
