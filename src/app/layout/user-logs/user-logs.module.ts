import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLogsRoutingModule } from './user-logs-routing.module';
import { UserLogsComponent } from './user-logs.component';
import { SharedModule } from '../../shared/shared.module';
import { LogsListComponent } from './logs-list/logs-list.component'; 


@NgModule({
  declarations: [
    UserLogsComponent,
    LogsListComponent, 
  ],
  imports: [
    CommonModule,
    UserLogsRoutingModule,
    SharedModule,
  ]
})
export class UserLogsModule { }
