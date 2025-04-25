import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PerfVisitModel } from '../../models/summary-dashboard.model';

@Component({
  selector: 'app-tracking-dr',
  standalone: false,
  templateUrl: './tracking-dr.component.html',
  styleUrl: './tracking-dr.component.scss'
})
export class TrackingDrComponent implements OnChanges {

  @Input() isLoading!: boolean;
  @Input() perfVisitDRList: PerfVisitModel[] = [];

  trackingVisitDRList: PerfVisitModel[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.trackingVisitDRList = this.perfVisitDRList;
  }

  
}
