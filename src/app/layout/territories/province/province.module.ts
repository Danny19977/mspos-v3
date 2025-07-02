import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProvinceRoutingModule } from './province-routing.module';
import { ProvinceComponent } from './province.component';
import { ProvinceListComponent } from './province-list/province-list.component';
import { SharedModule } from '../../../shared/shared.module';
import { ProvinceViewComponent } from './province-view/province-view.component';


@NgModule({
  declarations: [
    ProvinceComponent,
    ProvinceListComponent,
    ProvinceViewComponent, 
  ],
  imports: [
    CommonModule,
    ProvinceRoutingModule,
    SharedModule,
  ]
})
export class ProvinceModule { }
