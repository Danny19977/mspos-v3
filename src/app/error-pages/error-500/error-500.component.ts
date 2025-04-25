import { Component } from '@angular/core';
import { routes } from '../../shared/routes/routes';


@Component({
  selector: 'app-error-500',
  standalone: false,
  templateUrl: './error-500.component.html',
  styleUrl: './error-500.component.scss'
})
export class Error500Component {
  public routes = routes;
}
