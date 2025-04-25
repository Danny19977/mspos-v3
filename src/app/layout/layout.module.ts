import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { SharedModule } from '../shared/shared.module';

import { SidebarComponent } from './common/sidebar/sidebar.component';
import { HeaderComponent } from './common/header/header.component';
import { LayoutCommonComponent } from './common/layout-common/layout-common.component';  
import { ProfileComponent } from './profile/profile.component';
import { AreaListComponent } from './areas/area-list/area-list.component';
import { PosVenteListComponent } from './pos-vente/pos-vente-list/pos-vente-list.component';
import { SupListComponent } from './sups/sup-list/sup-list.component'; 
import { AsmListComponent } from './asm/asm-list/asm-list.component';
import { ManagerListComponent } from './managers/manager-list/manager-list.component';
import { ChangePasswordComponent } from './profile/change-password/change-password.component';
import { EditProfileComponent } from './profile/edit-profile/edit-profile.component';
import { CycloComponent } from './cyclo/cyclo.component';
import { CountryComponent } from './country/country.component';
import { SubareaComponent } from './subarea/subarea.component';
import { BrandComponent } from './brand/brand.component';
import { DrComponent } from './dr/dr.component';
import { CommuneComponent } from './commune/commune.component';
import { RouteplanComponent } from './routeplan/routeplan.component';
import { PosEquipmentComponent } from './pos-vente/pos-equipment/pos-equipment.component'; 
import { PosViewComponent } from './pos-vente/pos-view/pos-view.component';


@NgModule({
  declarations: [
    LayoutComponent,
    SidebarComponent,
    HeaderComponent,
    LayoutCommonComponent, 
    ProfileComponent, 
    AreaListComponent, 
    PosVenteListComponent,
    SupListComponent, 
    AsmListComponent,
    ManagerListComponent,
    ChangePasswordComponent,
    EditProfileComponent,
    CycloComponent,
    CountryComponent,
    SubareaComponent,
    BrandComponent,
    DrComponent,
    CommuneComponent,
    RouteplanComponent,
    PosEquipmentComponent, 
    PosViewComponent,
    
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    SharedModule,
  ]
})
export class LayoutModule { }
