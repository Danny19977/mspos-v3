import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { CountryComponent } from '../country/country.component';
import { SubareaComponent } from '../subarea/subarea.component';
import { CommuneComponent } from '../commune/commune.component';
import { AreaListComponent } from '../areas/area-list/area-list.component';

// Services - Lazy loaded only when module is loaded
import { CountryService } from '../country/country.service';
import { SubareaService } from '../subarea/subarea.service';
import { CommuneService } from '../commune/commune.service';

const routes: Routes = [
  {
    path: 'countries/country-list',
    component: CountryComponent,
  },
  {
    path: 'provinces',
    loadChildren: () =>
      import('../province/province.module').then(
        (m) => m.ProvinceModule,
      ),
  },
  {
    path: 'areas/area-list',
    component: AreaListComponent,
  },
  {
    path: 'subareas/subarea-list',
    component: SubareaComponent,
  },
  {
    path: 'communes/commune-list',
    component: CommuneComponent,
  },
];

@NgModule({
  declarations: [
    CountryComponent,
    SubareaComponent,
    CommuneComponent,
    AreaListComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ],
  providers: [
    CountryService,
    SubareaService,
    CommuneService,
  ]
})
export class TerritoriesModule { }
