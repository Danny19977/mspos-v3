import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'; 
import { SelectivePreloadingStrategy } from './utils/selective-preloading-strategy';

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
    data: { preload: true } // Preload only this important module
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
  imports: [RouterModule.forRoot(routes, { 
    useHash: false, 
    preloadingStrategy: SelectivePreloadingStrategy,
    enableTracing: false,
    initialNavigation: 'enabledBlocking'
  })],
  providers: [SelectivePreloadingStrategy],
  exports: [RouterModule]
})
export class AppRoutingModule { }
