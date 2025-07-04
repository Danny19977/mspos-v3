import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PosRoutingModule } from './pos-routing.module';
import { PosComponent } from './pos.component';
import { PostformListComponent } from './postform-list/postform-list.component';
import { SharedModule } from '../../../shared/shared.module';
import { PosformService } from './posform.service';
import { PosformFilterComponent } from './posform-filter/posform-filter.component';


@NgModule({
  declarations: [
    PosComponent,
    PostformListComponent,
    PosformFilterComponent, 
  ],
  imports: [
    CommonModule,
    PosRoutingModule,
    SharedModule,
  ],
  providers: [ 
    PosformService,
  ],
})
export class PosModule { }
