import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableViewModel } from '../../../models/dashboard.models';
import { IProvince } from '../../../../province/models/province.model';

@Component({
  selector: 'app-nd-table-view',
  standalone: false,
  templateUrl: './nd-table-view.component.html',
  styleUrl: './nd-table-view.component.scss'
})
export class NdTableViewComponent implements OnChanges {
  
  @Input() tableView: TableViewModel[] = [];
  @Input() isLoading!: boolean;

  tableViewList: TableViewModel[] = [];

  provinceList: IProvince[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.tableViewList = this.tableView;
  } 
}
