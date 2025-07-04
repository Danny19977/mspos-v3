import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PosComponent } from './pos.component';
import { PostformListComponent } from './postform-list/postform-list.component';
import { PosformFilterComponent } from './posform-filter/posform-filter.component';

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
      {
        path: 'pos-form-filter/:name/:uuid',
        component: PosformFilterComponent,
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PosRoutingModule { }
