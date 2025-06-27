import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-pos-user-list',
  standalone: false,
  templateUrl: './pos-user-list.component.html',
  styleUrls: ['./pos-user-list.component.scss']
})
export class PosUserListComponent {
     @Input() userUuid!: string;  
}
