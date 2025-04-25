import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core'; 
import { AuthService } from '../auth.service';

export const onlineGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  let isActive: boolean = false;

  const currentUser = authService.user().subscribe((user) => {
    if (user.uuid !== '') {
      isActive = false;
      router.navigate(['/auth/lock-screen']); 
      return user
    } else {
      isActive = true;
      router.navigate(['/auth/login']);
      return null;
    }
  });
  // if (!currentUser || currentUser.uuid === '') {
  //   router.navigate(['/auth/login']);
  //   return false;
  // } else {
  //   router.navigate(['/auth/lock-screen']);
  //   return false;
  // }
  return isActive;
};
