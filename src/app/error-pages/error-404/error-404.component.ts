import { Component } from '@angular/core';
import { routes } from '../../shared/routes/routes';


@Component({
  selector: 'app-error-404',
  standalone: false,
  templateUrl: './error-404.component.html',
  styleUrl: './error-404.component.scss'
})
export class Error404Component {
  public routes = routes;
}
