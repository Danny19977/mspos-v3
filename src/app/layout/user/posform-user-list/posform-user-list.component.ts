import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-posform-user-list',
  standalone: false,
  templateUrl: './posform-user-list.component.html',
  styleUrls: ['./posform-user-list.component.scss']
})
export class PosformUserListComponent {
    @Input() userUuid!: string;
}
