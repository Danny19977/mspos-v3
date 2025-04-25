import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogsListComponent } from './logs-list/logs-list.component';

const routes: Routes = [
  { path: 'logs-list', component: LogsListComponent },

  { path: '', redirectTo: 'logs-list', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserLogsRoutingModule { }
