import { Component, signal, inject } from '@angular/core';
import { NavigationStart, Router, Event as RouterEvent } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonService } from '../shared/common/common.service';
import { url } from '../shared/model/sidebar.model';

@Component({
  selector: 'app-auth',
  standalone: false,
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent {
  // Services avec inject()
  private readonly router = inject(Router);
  private readonly common = inject(CommonService);

  // Signals pour l'état du composant
  readonly themeMode = signal('');
  readonly base = signal('');
  readonly page = signal('');
  readonly last = signal('');

  constructor() {
    // Observer les événements de navigation
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((data: RouterEvent) => {
        if (data instanceof NavigationStart) {
          this.getRoutes(data);
        }
      });
    
    // Initialiser avec l'URL actuelle
    this.getRoutes(this.router);
  }

  private getRoutes(data: url): void {
    const splitVal = data.url.split('/');
    this.base.set(splitVal[1]);
    this.page.set(splitVal[2]);
    this.last.set(splitVal[3]);
    this.common.base.next(splitVal[1]);
    this.common.page.next(splitVal[2]);
    this.common.last.next(splitVal[3]);
  } 
}
