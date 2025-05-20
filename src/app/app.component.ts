import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, NgZone, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import {
  NavigationEnd,
  NavigationStart,
  
  Event as RouterEvent,
} from '@angular/router';
import { filter, first } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'mspos-v3';
  
  public page = '';

 
  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private zone: NgZone,
    private router: Router,
    private swUpdate: SwUpdate // Inject SwUpdate
  ) {
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationStart) {
        const URL = event.url.split('/');
        this.page = URL[1];
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Effacer le cache au démarrage
      this.clearCache();

      this.zone.runOutsideAngular(() => {
        this.router.events
          .pipe(
            filter((event) => event instanceof NavigationEnd),
            first()
          )
          .subscribe(() => {
            const preloader = document.querySelector('.site-preloader');

            if (!preloader) {
              return;
            }

            preloader.addEventListener('transitionend', (event: Event) => {
              if (
                event instanceof TransitionEvent &&
                event.propertyName === 'opacity'
              ) {
                preloader.remove();
                document.querySelector('.site-preloader-style')?.remove();
              }
            });
            preloader.classList.add('site-preloader__fade');

            if (
              getComputedStyle(preloader).opacity === '0' &&
              preloader.parentNode
            ) {
              preloader.parentNode.removeChild(preloader);
            }
          });
      });

      // Vérifier les mises à jour du service worker
      if (this.swUpdate.isEnabled) {
        this.swUpdate.versionUpdates.subscribe((event) => {
          if (event.type === 'VERSION_READY') {
            if (confirm('Une nouvelle version est disponible. Voulez-vous recharger ?')) {
              window.location.reload();
            }
          }
        });
      }
    }
  }

  private clearCache(): void {
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          caches.delete(cacheName);
        });
      });
      console.log('Cache cleared at application startup.');
    }
  }
}
