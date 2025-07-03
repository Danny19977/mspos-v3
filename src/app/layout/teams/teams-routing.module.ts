import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { AsmListComponent } from './asm/asm-list/asm-list.component';
import { SupListComponent } from './sups/sup-list/sup-list.component';
import { DrComponent } from './dr/dr.component';
import { CycloComponent } from './cyclo/cyclo.component';
 
import { SupFilterComponent } from './sups/sup-filter/sup-filter.component';
import { DrFilterComponent } from './dr/dr-filter/dr-filter.component';
import { CycloFilterComponent } from './cyclo/cyclo-filter/cyclo-filter.component';

const routes: Routes = [
  {
    path: 'asm/asm-list',
    component: AsmListComponent,
  },
  {
    path: 'supervisors/sup-list',
    component: SupListComponent,
  },
  {
    path: 'supervisors/sup-filter/:name/:uuid',
    component: SupFilterComponent,
  },
  {
    path: 'drs/dr-list',
    component: DrComponent,
  },
  {
    path: 'drs/dr-filter/:name/:uuid',
    component: DrFilterComponent,
  },
  {
    path: 'cyclos/cyclo-list',
    component: CycloComponent,
  },
  {
    path: 'cyclos/cyclo-filter/:name/:uuid',
    component: CycloFilterComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeamsRoutingModule { }