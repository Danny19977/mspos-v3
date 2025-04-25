import { Component } from '@angular/core';
import { NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { CommonService } from '../shared/common/common.service';
import { url } from '../shared/model/sidebar.model';

@Component({
  selector: 'app-auth',
  standalone: false,
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  public themeMode = '';
  base = '';
  page = '';
  last = '';

  constructor(
    private Router: Router,
    private common: CommonService,
  ) {
    this.Router.events.subscribe((data: RouterEvent) => {
      if (data instanceof NavigationStart) {
        this.getRoutes(data);
      }
    });
     this.getRoutes(this.Router);
  }

  private getRoutes(data: url): void {
    const splitVal = data.url.split('/');
    this.base = splitVal[1];
    this.page = splitVal[2];
    this.last = splitVal[3];
    this.common.base.next(splitVal[1]);
    this.common.page.next(splitVal[2]);
    this.common.last.next(splitVal[3]);
  } 
}
