import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableViewModel } from '../../models/nd-dashboard.models';

@Component({
  selector: 'app-oos-table-view',
  standalone: false,
  templateUrl: './oos-table-view.component.html',
  styleUrl: './oos-table-view.component.scss'
})
export class OosTableViewComponent implements OnChanges {
  
  @Input() tableView: TableViewModel[] = [];
  @Input() isLoading!: boolean;

  tableViewList: TableViewModel[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.tableViewList = this.tableView;
  } 
}
