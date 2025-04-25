import { Component } from '@angular/core';
import { routes } from '../../../shared/routes/routes';

@Component({
  selector: 'app-blank-page',
  standalone: false,
  templateUrl: './blank-page.component.html',
  styleUrl: './blank-page.component.scss'
})
export class BlankPageComponent {
  public routes = routes

}
