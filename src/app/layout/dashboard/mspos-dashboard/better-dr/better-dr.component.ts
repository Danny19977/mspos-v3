import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BetterModel } from '../../models/summary-dashboard.model';

@Component({
  selector: 'app-better-dr',
  standalone: false,
  templateUrl: './better-dr.component.html',
  styleUrl: './better-dr.component.scss'
})
export class BetterDrComponent implements OnChanges { 
  @Input() isLoading!: boolean;
  @Input() betterDRList: BetterModel[] = [];

  betterDRDataList: BetterModel[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.betterDRDataList = this.betterDRList;
  }


}
