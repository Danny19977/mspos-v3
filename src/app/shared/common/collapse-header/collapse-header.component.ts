import { Component } from '@angular/core'; 
import { DataService } from '../../data/data.service';

@Component({
  selector: 'app-collapse-header',
  standalone: false,
  templateUrl: './collapse-header.component.html',
  styleUrl: './collapse-header.component.scss',
})
export class CollapseHeaderComponent {
  public isCollapsed = false;

  toggleCollapse() {
    this.data.toggleCollapse();
    this.isCollapsed = !this.isCollapsed;
  }
  constructor(private data: DataService) {}
}
