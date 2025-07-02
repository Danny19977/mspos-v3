import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserRoutingModule } from './user-routing.module';
import { UserComponent } from './user.component';
import { UserListComponent } from './user-list/user-list.component';
import { SharedModule } from '../../../shared/shared.module'; 
import {NgxPaginationModule} from 'ngx-pagination';
import { UserViewComponent } from './user-view/user-view.component';
import { PosUserListComponent } from './pos-user-list/pos-user-list.component';
import { PosformUserListComponent } from './posform-user-list/posform-user-list.component';
import { RouteplanUserListComponent } from './routeplan-user-list/routeplan-user-list.component';


@NgModule({
  declarations: [
    UserComponent,
    UserListComponent,
    UserViewComponent,
    PosUserListComponent,
    PosformUserListComponent,
    RouteplanUserListComponent,
  ],
  imports: [
    CommonModule,
    UserRoutingModule,
    SharedModule,
    NgxPaginationModule
  ] 
})
export class UserModule { }
