import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { SharedModule } from '../../shared/shared.module';

// Components
import { CountryComponent } from './country/country.component';
import { SubareaComponent } from './subarea/subarea.component';
import { CommuneComponent } from './commune/commune.component';
import { AreaListComponent } from './areas/area-list/area-list.component';

// Services - Lazy loaded only when module is loaded
import { CountryService } from './country/country.service';
import { SubareaService } from './subarea/subarea.service';
import { CommuneService } from './commune/commune.service';
import { SubareaViewComponent } from './subarea/subarea-view/subarea-view.component';
import { AreaViewComponent } from './areas/area-view/area-view.component';
import { CommuneViewComponent } from './commune/commune-view/commune-view.component';
import { TerritoriesRoutingModule } from './territories-routing.module';
 

@NgModule({
  declarations: [
    CountryComponent,
    SubareaComponent,
    CommuneComponent,
    AreaListComponent,
    AreaViewComponent,
    SubareaViewComponent,
    CommuneViewComponent,
  ],
  imports: [
    CommonModule,
    TerritoriesRoutingModule,
    SharedModule, 
  ],
  providers: [
    CountryService,
    SubareaService,
    CommuneService,
  ]
})
export class TerritoriesModule { }
