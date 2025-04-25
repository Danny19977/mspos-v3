import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollapseHeaderComponent } from './collapse-header.component';



@NgModule({
  declarations: [
    CollapseHeaderComponent
  ],
  imports: [
    CommonModule,
    MatTooltipModule
  ],
  exports: [CollapseHeaderComponent],
})
export class CollapseHeaderModule { }
