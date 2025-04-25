import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PosRoutingModule } from './pos-routing.module';
import { PosComponent } from './pos.component';
import { PostformListComponent } from './postform-list/postform-list.component';
import { SharedModule } from '../../shared/shared.module';
import { PosformService } from './posform.service';


@NgModule({
  declarations: [
    PosComponent,
    PostformListComponent, 
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
