import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PagesRoutingModule } from './pages-routing.module';
import { PagesComponent } from './pages.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { UnderMaintenanceComponent } from './under-maintenance/under-maintenance.component';
import { BlankPageComponent } from './blank-page/blank-page.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [
    PagesComponent,
    ComingSoonComponent,
    UnderMaintenanceComponent,
    BlankPageComponent, 
  ],
  imports: [
    CommonModule,
    PagesRoutingModule,
    SharedModule
  ]
})
export class PagesModule { }
