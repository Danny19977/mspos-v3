import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

// Components
import { CountryComponent } from './country/country.component';
import { SubareaComponent } from './subarea/subarea.component';
import { CommuneComponent } from './commune/commune.component';
import { AreaListComponent } from './areas/area-list/area-list.component';

// Services - Lazy loaded only when module is loaded 
import { SubareaViewComponent } from './subarea/subarea-view/subarea-view.component';
import { AreaViewComponent } from './areas/area-view/area-view.component';
import { CommuneViewComponent } from './commune/commune-view/commune-view.component';

const routes: Routes = [
  {
    path: 'countries/country-list',
    component: CountryComponent,
  },
  {
    path: 'provinces',
    loadChildren: () =>
      import('./province/province.module').then(
        (m) => m.ProvinceModule,
      ),
  },
  {
    path: 'areas/area-list',
    component: AreaListComponent,
    data: {
      breadcrumb: 'Area List'
    }
  },
  {
    path: 'areas/area-filter/:name/:uuid',
    component: AreaViewComponent,
    data: {
      breadcrumb: 'Area List by UUID'
    }
  },
  {
    path: 'subareas/subarea-list',
    component: SubareaComponent,
  },
  {
    path: 'subareas/subarea-filter/:name/:uuid',
    component: SubareaViewComponent,
    data: {
      breadcrumb: 'Subarea List by UUID'
    }
  },
  {
    path: 'communes/commune-list',
    component: CommuneComponent,
  },
  {
    path: 'communes/commune-filter/:name/:uuid',
    component: CommuneViewComponent,
    data: {
      breadcrumb: 'Commune List by UUID'
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TerritoriesRoutingModule { }