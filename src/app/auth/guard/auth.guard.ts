import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateFn } from '@angular/router';
import { map, Observable } from 'rxjs'; 
import { AuthService } from '../auth.service';

/**
 * Guard d'authentification moderne utilisant inject()
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
): Observable<boolean> | Promise<boolean> | boolean => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.user().pipe(
    map(user => {
      if (user.uuid !== "00000000-0000-0000-0000-0000") {
        return true;
      } else {
        router.navigate(['/auth/login']);
        return false;
      }
    })
  );
};

// Alias pour la compatibilité avec l'ancien code (si nécessaire)
export const AuthGuard = authGuard;
