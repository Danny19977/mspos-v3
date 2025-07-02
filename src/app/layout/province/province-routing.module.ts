import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'; 
import { ProvinceListComponent } from './province-list/province-list.component';
import { ProvinceComponent } from './province.component';
import { ProvinceViewComponent } from './province-view/province-view.component';

const routes: Routes = [
  {
    path: '',
    component: ProvinceComponent,
    children: [
      {
        path: '',
        redirectTo: 'province-list',
        pathMatch: 'full'
      },
      {
        path: 'province-list',
        component: ProvinceListComponent,
      },
      {
        path: 'province-list/:name/:uuid',
        component: ProvinceViewComponent,
        data: {
          breadcrumb: 'Province List by UUID'
        }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProvinceRoutingModule { }
