import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { AuthComponent } from './auth.component'; 
import { RegisterComponent } from './register/register.component';
import { SharedModule } from '../shared/shared.module';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { LockScreenComponent } from './lock-screen/lock-screen.component'; 


@NgModule({
  declarations: [
    LoginComponent,
    AuthComponent,
    RegisterComponent,
    ResetPasswordComponent,
    LockScreenComponent, 
  ],
  imports: [
    CommonModule,
    AuthRoutingModule, 
    SharedModule,
  ]
})
export class AuthModule { }
