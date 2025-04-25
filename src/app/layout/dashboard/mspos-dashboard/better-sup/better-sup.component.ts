import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BetterModel } from '../../models/summary-dashboard.model';

@Component({
  selector: 'app-better-sup',
  standalone: false,
  templateUrl: './better-sup.component.html',
  styleUrl: './better-sup.component.scss'
})
export class BetterSupComponent implements OnChanges { 
  @Input() isLoading!: boolean;
  @Input() betterSupList: BetterModel[] = [];

  betterSupDataList: BetterModel[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.betterSupDataList = this.betterSupList;
  }



}
