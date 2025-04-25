import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AuthComponent } from './auth.component';
import { RegisterComponent } from './register/register.component';
import { LockScreenComponent } from './lock-screen/lock-screen.component';
import { onlineGuard } from './guard/online.guard';

const routes: Routes = [
  // { 
  //   path: '', 
  //   redirectTo: 'signin', 
  //   pathMatch: 'full' 
  // },
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent,
        // canActivate: [onlineGuard] 
      },
      {
        path: 'register',
        component: RegisterComponent,
      },
      {
        path: 'lock-screen',
        component: LockScreenComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
