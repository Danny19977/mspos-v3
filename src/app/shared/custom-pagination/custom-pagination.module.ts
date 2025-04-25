import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CustomPaginationComponent } from './custom-pagination.component';
import { PageChange } from '../pageChange/page-change.component';

@NgModule({
  declarations: [CustomPaginationComponent,PageChange],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  exports: [CustomPaginationComponent],
})
export class CustomPaginationModule {}
