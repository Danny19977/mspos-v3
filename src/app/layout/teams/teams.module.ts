import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { AsmListComponent } from './asm/asm-list/asm-list.component';
import { SupListComponent } from './sups/sup-list/sup-list.component';
import { DrComponent } from './dr/dr.component';
import { CycloComponent } from './cyclo/cyclo.component';

// Services - Lazy loaded only when module is loaded
import { AsmService } from './asm/asm.service';
import { SupService } from './sups/sup.service';
import { DrService } from './dr/dr.service';
import { CycloService } from './cyclo/cyclo.service';
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
    path: 'drs/dr-list',
    component: DrComponent,
  },
  {
    path: 'cyclos/cyclo-list',
    component: CycloComponent,
  },
];

@NgModule({
  declarations: [
    AsmListComponent,
    SupListComponent,
    DrComponent,
    CycloComponent,
    SupFilterComponent,
    DrFilterComponent,
    CycloFilterComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    AsmService,
    SupService,
    DrService,
    CycloService,
  ]
})
export class TeamsModule { }
