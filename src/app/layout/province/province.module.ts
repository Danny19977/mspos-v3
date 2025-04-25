import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProvinceRoutingModule } from './province-routing.module';
import { ProvinceComponent } from './province.component';
import { ProvinceListComponent } from './province-list/province-list.component';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  declarations: [
    ProvinceComponent,
    ProvinceListComponent, 
  ],
  imports: [
    CommonModule,
    ProvinceRoutingModule,
    SharedModule,
  ]
})
export class ProvinceModule { }
