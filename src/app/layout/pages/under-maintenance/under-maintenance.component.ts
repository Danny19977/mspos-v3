import { Component } from '@angular/core';
import { routes } from '../../../shared/routes/routes';

@Component({
  selector: 'app-under-maintenance',
  standalone: false,
  templateUrl: './under-maintenance.component.html',
  styleUrl: './under-maintenance.component.scss'
})
export class UnderMaintenanceComponent {
public routes = routes

}
