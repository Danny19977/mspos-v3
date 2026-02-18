import { Component } from '@angular/core';

@Component({
  selector: 'app-reload',
  standalone: true,
  templateUrl: './reload.component.html',
  styleUrl: './reload.component.scss'
})
export class ReloadComponent {

  public reload() {
    location.reload();
  }
}
