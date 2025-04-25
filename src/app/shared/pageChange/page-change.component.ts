import { Component } from '@angular/core';
import {
  pageSelection,
  PaginationService,
} from '../custom-pagination/pagination.service';

@Component({
  selector: 'app-page-change',
  standalone: false, 
  templateUrl: './page-change.component.html',
})
 
export class PageChange {
  public pageSize = 10;
  // pagination variables
  public skip = 0;
  public limit: number = this.pageSize;
  public currentPage = 1;
  public pageSelection: pageSelection[] = [];
  //** / pagination variables

  constructor(private pagination: PaginationService) {

  }

   

  
  public changePageSize(pageSize: number): void {
    this.pageSelection = [];
    this.limit = pageSize;
    this.skip = 0;
    this.currentPage = 1;
    // this.getTableData();
    this.pagination.tablePageSize.next({
      skip: this.skip,
      limit: this.limit,
      pageSize: this.pageSize,
    });
  }


}
