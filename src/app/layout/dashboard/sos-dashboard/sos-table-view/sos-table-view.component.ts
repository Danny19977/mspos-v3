import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableViewModel } from '../../models/nd-dashboard.models';

@Component({
  selector: 'app-sos-table-view',
  standalone: false,
  templateUrl: './sos-table-view.component.html',
  styleUrl: './sos-table-view.component.scss'
})
export class SosTableViewComponent implements OnChanges {
  
  @Input() tableView: TableViewModel[] = [];
  @Input() isLoading!: boolean;

  tableViewList: TableViewModel[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.tableViewList = this.tableView;
  } 
}