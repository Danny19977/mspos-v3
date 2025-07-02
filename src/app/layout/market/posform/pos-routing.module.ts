import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PosComponent } from './pos.component';
import { PostformListComponent } from './postform-list/postform-list.component';

const routes: Routes = [
  {
    path: '',
    component: PosComponent,
    children: [
      {
        path: '',
        redirectTo: 'pos-form-list',
        pathMatch: 'full'
      },
      {
        path: 'pos-form-list',
        component: PostformListComponent,
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PosRoutingModule { }
