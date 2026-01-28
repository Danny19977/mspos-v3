import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface PlatformInfo {
  name: 'windows' | 'mac' | 'ios' | 'android' | 'other';
  isStandalone: boolean;
  canInstall: boolean;
  browserName: string;
}

@Injectable({
  providedIn: 'root'
})
export class PwaInstallService implements OnDestroy {
  private deferredPrompt: any = null;
  private canInstall$ = new BehaviorSubject<boolean>(false);
  private platformInfo$ = new BehaviorSubject<PlatformInfo>(this.detectPlatform());
  private destroy$ = new Subject<void>();

  constructor() {
    this.initializeService();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeService(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Écouter l'événement beforeinstallprompt
    fromEvent(window, 'beforeinstallprompt')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: any) => {
        console.log('📲 beforeinstallprompt détecté');
        event.preventDefault();
        this.deferredPrompt = event;
        this.canInstall$.next(true);
      });

    // Écouter l'événement appinstalled
    fromEvent(window, 'appinstalled')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('✅ Application installée avec succès');
        this.canInstall$.next(false);
        this.deferredPrompt = null;
        // Marquer l'application comme installée pour ne plus jamais afficher le prompt
        this.markAsInstalled();
        this.updatePlatformInfo();
      });

    // Mettre à jour les informations de plateforme
    this.updatePlatformInfo();
  }

  /**
   * Détecte la plateforme de l'utilisateur
   */
  private detectPlatform(): PlatformInfo {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        name: 'other',
        isStandalone: false,
        canInstall: false,
        browserName: 'unknown'
      };
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform || navigator.platform.toLowerCase();

    // Détecter le système d'exploitation
    let osName: 'windows' | 'mac' | 'ios' | 'android' | 'other' = 'other';

    if (/iphone|ipad|ipod/.test(userAgent)) {
      osName = 'ios';
    } else if (/android/.test(userAgent)) {
      osName = 'android';
    } else if (/win/.test(platform)) {
      osName = 'windows';
    } else if (/mac/.test(platform)) {
      osName = 'mac';
    }

    // Détecter le navigateur
    let browserName = 'unknown';
    if (userAgent.includes('edg')) {
      browserName = 'edge';
    } else if (userAgent.includes('chrome')) {
      browserName = 'chrome';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      browserName = 'safari';
    } else if (userAgent.includes('firefox')) {
      browserName = 'firefox';
    }

    // Vérifier si l'app est déjà installée (mode standalone)
    const isStandalone = this.isRunningStandalone();

    // Vérifier si l'installation est possible
    const canInstall = this.checkCanInstall(osName, browserName, isStandalone);

    return {
      name: osName,
      isStandalone,
      canInstall,
      browserName
    };
  }

  /**
   * Vérifie si l'application est en mode standalone
   */
  private isRunningStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    // Pour iOS
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // Pour Android et Desktop
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }

    // Pour d'autres navigateurs
    if (document.referrer.includes('android-app://')) {
      return true;
    }

    return false;
  }

  /**
   * Vérifie si l'installation est possible
   */
  private checkCanInstall(osName: string, browserName: string, isStandalone: boolean): boolean {
    // Si déjà installé, pas besoin de réinstaller
    if (isStandalone) {
      return false;
    }

    // Android avec Chrome, Edge, Samsung Internet
    if (osName === 'android' && ['chrome', 'edge'].includes(browserName)) {
      return true;
    }

    // Windows/Mac avec Chrome, Edge
    if (['windows', 'mac'].includes(osName) && ['chrome', 'edge'].includes(browserName)) {
      return true;
    }

    // iOS avec Safari (installation manuelle)
    if (osName === 'ios' && browserName === 'safari') {
      return true;
    }

    return false;
  }

  /**
   * Met à jour les informations de plateforme
   */
  private updatePlatformInfo(): void {
    this.platformInfo$.next(this.detectPlatform());
  }

  /**
   * Observable pour savoir si l'installation est possible
   */
  getCanInstall(): Observable<boolean> {
    return this.canInstall$.asObservable();
  }

  /**
   * Observable pour obtenir les informations de plateforme
   */
  getPlatformInfo(): Observable<PlatformInfo> {
    return this.platformInfo$.asObservable();
  }

  /**
   * Déclenche l'installation PWA
   */
  async installPwa(): Promise<{ success: boolean; userChoice?: string }> {
    if (!this.deferredPrompt) {
      console.warn('⚠️ Aucun prompt d\'installation disponible');
      return { success: false };
    }

    try {
      // Afficher le prompt d'installation
      this.deferredPrompt.prompt();

      // Attendre la réponse de l'utilisateur
      const choiceResult = await this.deferredPrompt.userChoice;

      console.log(`👤 Choix de l'utilisateur: ${choiceResult.outcome}`);

      if (choiceResult.outcome === 'accepted') {
        console.log('✅ L\'utilisateur a accepté l\'installation');
        this.canInstall$.next(false);
        return { success: true, userChoice: 'accepted' };
      } else {
        console.log('❌ L\'utilisateur a refusé l\'installation');
        return { success: false, userChoice: 'dismissed' };
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'installation:', error);
      return { success: false };
    } finally {
      // Le prompt ne peut être utilisé qu'une seule fois
      this.deferredPrompt = null;
    }
  }

  /**
   * Obtient les instructions d'installation spécifiques à la plateforme
   */
  getInstallInstructions(): string[] {
    const platform = this.platformInfo$.value;

    switch (platform.name) {
      case 'ios':
        return [
          'Appuyez sur le bouton de partage',
          'Faites défiler et sélectionnez "Sur l\'écran d\'accueil"',
          'Appuyez sur "Ajouter"'
        ];

      case 'android':
        if (platform.browserName === 'chrome') {
          return [
            'Appuyez sur le menu (⋮) en haut à droite',
            'Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
            'Confirmez l\'installation'
          ];
        }
        return [
          'Appuyez sur le menu de votre navigateur',
          'Sélectionnez "Ajouter à l\'écran d\'accueil"',
          'Confirmez l\'installation'
        ];

      case 'windows':
      case 'mac':
        if (platform.browserName === 'chrome') {
          return [
            'Cliquez sur l\'icône d\'installation dans la barre d\'adresse',
            'Ou allez dans le menu (⋮) > "Installer MSPOS"',
            'Confirmez l\'installation'
          ];
        }
        if (platform.browserName === 'edge') {
          return [
            'Cliquez sur l\'icône d\'installation dans la barre d\'adresse',
            'Ou allez dans le menu (⋯) > "Applications" > "Installer ce site en tant qu\'application"',
            'Confirmez l\'installation'
          ];
        }
        return [
          'Utilisez Chrome ou Edge pour installer cette application',
          'Cliquez sur l\'icône d\'installation dans la barre d\'adresse'
        ];

      default:
        return [
          'L\'installation n\'est pas disponible sur cette plateforme',
          'Essayez d\'utiliser Chrome, Edge ou Safari'
        ];
    }
  }

  /**
   * Vérifie si le dialog doit être affiché
   */
  shouldShowInstallPrompt(): boolean {
    const platform = this.platformInfo$.value;

    // Ne JAMAIS afficher si l'app est déjà installée (mode standalone)
    if (platform.isStandalone) {
      console.log('ℹ️ Application déjà installée, pas de prompt');
      return false;
    }

    // Double vérification: vérifier si l'utilisateur a déjà installé l'app
    const installed = localStorage.getItem('pwa-installed');
    if (installed === 'true') {
      console.log('ℹ️ Application marquée comme installée, pas de prompt');
      return false;
    }

    // Vérifier si l'installation est possible sur cette plateforme
    if (!platform.canInstall) {
      console.log('ℹ️ Installation non disponible sur cette plateforme');
      return false;
    }

    // Vérifier si l'utilisateur a déjà fermé le dialog récemment
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      // Réafficher après 7 jours
      if (daysSinceDismissed < 7) {
        console.log(`ℹ️ Dialog fermé il y a ${Math.round(daysSinceDismissed)} jours, pas de prompt`);
        return false;
      }
    }

    console.log('✅ Conditions remplies pour afficher le prompt d\'installation');
    return true;
  }

  /**
   * Marque le dialog comme fermé
   */
  dismissInstallPrompt(): void {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }

  /**
   * Marque l'application comme installée
   */
  markAsInstalled(): void {
    localStorage.setItem('pwa-installed', 'true');
  }
}
