import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-stats-total',
  standalone: false,
  templateUrl: './stats-total.component.html',
  styleUrl: './stats-total.component.scss'
})
export class StatsTotalComponent {
  @Input() isLoading!: boolean;
  @Input() drCount = 0;
  @Input() posCount = 0;
  @Input() provinceCount = 0;
  @Input() areaCount = 0;



}
