import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateFn } from '@angular/router';
import { map, Observable, of, catchError } from 'rxjs'; 
import { AuthService } from '../auth.service';
import { NetworkService } from '../../services/network.service';

/**
 * Guard d'authentification moderne utilisant inject()
 * Gère les modes online et offline
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): Observable<boolean> | Promise<boolean> | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const networkService = inject(NetworkService);

  return authService.user().pipe(
    map(user => {
      if (user && user.uuid !== "00000000-0000-0000-0000-0000") {
        return true;
      } else {
        console.warn('🚫 Accès refusé: utilisateur non authentifié');
        router.navigate(['/auth/login']);
        return false;
      }
    }),
    catchError(error => {
      console.error('❌ Erreur dans authGuard:', error);
      
      // Si on est offline et qu'il y a une erreur, vérifier si on a des données locales
      if (!networkService.isOnline()) {
        console.warn('📴 Mode offline: redirection vers login');
      }
      
      router.navigate(['/auth/login']);
      return of(false);
    })
  );
};

// Alias pour la compatibilité avec l'ancien code (si nécessaire)
export const AuthGuard = authGuard;

