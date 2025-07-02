import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { ManagerListComponent } from './managers/manager-list/manager-list.component';
import { ProfileComponent } from './profile/profile.component';

// Services - Lazy loaded only when module is loaded
import { ManagerService } from './managers/manager.service';
import { UserService } from './user/user.service';
import { LogsService } from './user-logs/logs.service';

const routes: Routes = [
  {
    path: 'managers/manager-list',
    component: ManagerListComponent,
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./user/user.module').then(
        (m) => m.UserModule
      ),
  },
  {
    path: 'profile',
    component: ProfileComponent,
  },
  {
    path: 'users-logs/activity',
    loadChildren: () =>
      import('./user-logs/user-logs.module').then(
        (m) => m.UserLogsModule
      ),
  },
];

@NgModule({
  declarations: [
    ManagerListComponent,
    ProfileComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    ManagerService,
    UserService,
    LogsService,
  ]
})
export class ManagementModule { }
