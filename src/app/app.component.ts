import { isPlatformBrowser } from '@angular/common';
import { Component, inject, NgZone, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, NavigationStart, Event as RouterEvent } from '@angular/router';
import { filter, first, takeUntil } from 'rxjs/operators';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { PerformanceService } from './core/services/performance.service';
import { SyncService } from './services/sync.service';
import { AutoSyncService } from './shared/services/auto-sync.service';
import { PwaInstallService } from './core/services/pwa-install.service';
import { PwaInstallDialogComponent } from './shared/pwa-install-dialog/pwa-install-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'mspos-v3';
  public page = '';
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);

  constructor(
    private zone: NgZone,
    private router: Router,
    private swUpdate: SwUpdate,
    private performanceService: PerformanceService,
    private syncService: SyncService, // Injection du service de synchronisation
    private autoSyncService: AutoSyncService,
    private pwaInstallService: PwaInstallService,
    private dialog: MatDialog
  ) {
    // Marquer le début du bootstrap Angular
    this.performanceService.mark('angular-constructor-start');

    // Optimisation: utiliser takeUntil pour éviter les fuites mémoire
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: RouterEvent) => {
        if (event instanceof NavigationStart) {
          const URL = event.url.split('/');
          this.page = URL[1];
        }
      });

    this.performanceService.mark('angular-constructor-end');
  }

  ngOnInit(): void {
    this.performanceService.mark('angular-init-start');

    if (isPlatformBrowser(this.platformId)) {
      // Démarrage optimisé
      this.initializeApp();
    }

    this.performanceService.markAppBootstrap();
    this.performanceService.mark('angular-init-end');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeApp(): void {
    // Mesure de performance
    const startTime = performance.now();

    console.group('🚀 Initialisation de MSPOS V3');
    console.log('⏱️ Démarrage de l\'initialisation...');

    // Marquer DOM ready
    if (document.readyState === 'complete') {
      this.performanceService.markDomReady();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        this.performanceService.markDomReady();
      });
    }

    // Initialiser le service de synchronisation offline/online
    console.log('🔄 Service de synchronisation initialisé');
    // Le SyncService écoute les changements de connexion et synchronise automatiquement
    if (this.syncService.isSyncInProgress()) {
      console.log('⏳ Synchronisation en cours...');
    }
    // Démarrer la sync automatique (périodique + reconnexion)
    this.autoSyncService.start();

    // Effacer le cache de manière optimisée
    this.clearCacheOptimized();

    // Gestion du splash screen optimisée
    this.handleSplashScreen(startTime);

    // Vérification des mises à jour du service worker
    this.setupServiceWorkerUpdates();

    // Afficher le dialog d'installation PWA si nécessaire
    this.showInstallPromptIfNeeded();

    console.groupEnd();
  }

  private handleSplashScreen(startTime: number): void {
    this.performanceService.mark('splash-screen-handling-start');

    this.zone.runOutsideAngular(() => {
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          first(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          const loadTime = performance.now() - startTime;
          console.log(`✅ Application prête en ${Math.round(loadTime)}ms`);

          this.performanceService.mark('first-route-loaded');

          // Masquer le preloader avec délai minimal pour la fluidité
          setTimeout(() => {
            this.hideSplashScreen();
          }, 300);
        });
    });
  }

  private hideSplashScreen(): void {
    this.performanceService.mark('splash-screen-hide-start');

    const preloader = document.querySelector('#splash-screen');

    if (!preloader) {
      console.log('ℹ️ Splash screen déjà masqué');
      return;
    }

    // Animation de sortie fluide
    preloader.addEventListener('transitionend', (event: Event) => {
      if (
        event instanceof TransitionEvent &&
        (event.propertyName === 'opacity' || event.propertyName === 'transform')
      ) {
        preloader.remove();
        document.querySelector('.site-preloader-style')?.remove();
        console.log('✨ Splash screen masqué avec succès');

        // Marquer la fin du chargement complet
        this.performanceService.markLoadComplete();
        this.performanceService.mark('splash-screen-removed');
      }
    }, { once: true });

    preloader.classList.add('fade-out');
    this.performanceService.mark('splash-screen-fade-started');

    // Fallback pour nettoyer le splash screen si l'événement transitionend ne se déclenche pas
    setTimeout(() => {
      if (preloader && preloader.parentNode) {
        preloader.remove();
        document.querySelector('.site-preloader-style')?.remove();
        console.log('🔧 Splash screen nettoyé via fallback');
        this.performanceService.markLoadComplete();
        this.performanceService.mark('splash-screen-removed-fallback');
      }
    }, 1000);
  }

  private clearCacheOptimized(): void {
    this.performanceService.mark('cache-clear-start');

    if (!('caches' in window)) {
      console.log('ℹ️ Cache API non supporté');
      return;
    }

    // Nettoyer le cache de manière asynchrone pour ne pas bloquer le démarrage
    caches.keys()
      .then((cacheNames) => {
        if (cacheNames.length === 0) {
          console.log('ℹ️ Aucun cache à nettoyer');
          this.performanceService.mark('cache-clear-none');
          return;
        }

        // Supprimer les anciens caches
        const deletePromises = cacheNames
          .filter(cacheName => cacheName.includes('mspos') || cacheName.includes('ngsw'))
          .map((cacheName) => {
            console.log(`🗑️ Suppression du cache: ${cacheName}`);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('✅ Nettoyage du cache terminé');
        this.performanceService.mark('cache-clear-complete');
      })
      .catch((error) => {
        console.warn('⚠️ Erreur lors du nettoyage du cache:', error);
        this.performanceService.mark('cache-clear-error');
      });
  }

  private setupServiceWorkerUpdates(): void {
    this.performanceService.mark('service-worker-setup-start');

    if (!this.swUpdate.isEnabled) {
      console.log('ℹ️ Service Worker désactivé');
      return;
    }

    // Vérifier les mises à jour de manière optimisée
    this.swUpdate.versionUpdates
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        switch (event.type) {
          case 'VERSION_DETECTED':
            console.log('🔄 Nouvelle version détectée, téléchargement...');
            this.performanceService.mark('sw-version-detected');
            break;
          case 'VERSION_READY':
            console.log('✅ Nouvelle version prête');
            this.performanceService.mark('sw-version-ready');
            this.promptForUpdate();
            break;
          case 'VERSION_INSTALLATION_FAILED':
            console.error('❌ Échec de l\'installation de la nouvelle version:', event.error);
            this.performanceService.mark('sw-installation-failed');
            break;
        }
      });

    // Vérifier s'il y a des mises à jour disponibles
    this.swUpdate.checkForUpdate()
      .then((hasUpdate) => {
        if (hasUpdate) {
          console.log('🔄 Vérification des mises à jour...');
          this.performanceService.mark('sw-update-available');
        } else {
          this.performanceService.mark('sw-no-update');
        }
      })
      .catch((error) => {
        console.error('❌ Erreur lors de la vérification des mises à jour:', error);
        this.performanceService.mark('sw-check-error');
      });

    this.performanceService.mark('service-worker-setup-complete');
  }

  private promptForUpdate(): void {
    // Notification non-intrusive pour la mise à jour
    const updateMessage = 'Une nouvelle version de MSPOS est disponible. Voulez-vous mettre à jour maintenant ?';

    if (confirm(updateMessage)) {
      console.log('🔄 Rechargement pour mise à jour...');
      this.performanceService.mark('sw-update-accepted');
      window.location.reload();
    } else {
      console.log('⏭️ Mise à jour reportée');
      this.performanceService.mark('sw-update-deferred');
      // La mise à jour sera appliquée au prochain rechargement
    }
  }

  /**
   * Affiche le dialog d'installation PWA si nécessaire
   */
  private showInstallPromptIfNeeded(): void {
    // Attendre un peu après le chargement pour ne pas être intrusif
    setTimeout(() => {
      this.pwaInstallService.getPlatformInfo()
        .pipe(first(), takeUntil(this.destroy$))
        .subscribe((platformInfo) => {
          // Vérifier si on doit afficher le prompt
          if (this.pwaInstallService.shouldShowInstallPrompt()) {
            console.log('📲 Affichage du dialog d\'installation PWA');
            
            // Afficher le dialog après un délai pour ne pas perturber l'expérience utilisateur
            setTimeout(() => {
              this.openInstallDialog(platformInfo);
            }, 3000); // 3 secondes après le chargement complet
          } else {
            console.log('ℹ️ Dialog d\'installation PWA non affiché');
          }
        });
    }, 1000);
  }

  /**
   * Ouvre le dialog d'installation PWA
   */
  private openInstallDialog(platformInfo: any): void {
    const dialogRef = this.dialog.open(PwaInstallDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { platformInfo },
      panelClass: 'pwa-install-dialog-panel',
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result?.installed) {
          console.log('✅ Application installée avec succès');
        } else if (result?.dismissed) {
          console.log('👋 Dialog d\'installation fermé par l\'utilisateur');
        }
      });
  }
}
