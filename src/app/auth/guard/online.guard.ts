import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core'; 
import { map } from 'rxjs';

export const onlineGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const storedUser = localStorage.getItem("auth_user");

  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    if (new Date(parsedUser.expiration) > new Date()) {
      if (parsedUser.user.uuid !== '') {
        // Redirect to /dashboard if uuid is not empty
        router.navigate(["/auth/lock-screen"]);
        return false;
      }
    } else {
      // Redirect to /auth/login if the expiration date is invalid
      router.navigate(["/auth/login"]);
      return true;
    }
  }

  return true;
};
