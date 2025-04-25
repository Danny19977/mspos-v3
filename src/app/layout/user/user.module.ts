import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './user.component';
import { UserListComponent } from './user-list/user-list.component';
import { SharedModule } from '../../shared/shared.module'; 
import {NgxPaginationModule} from 'ngx-pagination'; 


@NgModule({
  declarations: [
    UserComponent,
    UserListComponent,  
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    SharedModule,
    NgxPaginationModule
  ] 
})
export class UserModule { }
