import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { onlineGuard } from './auth/guard/online.guard';
import { AuthGuard } from './auth/guard/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('../app/auth/auth.module').then(
        (m) => m.AuthModule
      ), 
  },
  {
    path: 'web',
    loadChildren: () =>
      import('../app/layout/layout.module').then(
        (m) => m.LayoutModule
      ), 
  },
  {
    path: 'error-pages',
    loadChildren: () =>
      import('./error-pages/error-pages.module').then(
        (m) => m.ErrorPagesModule
      ),
  },


  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'error-pages', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
