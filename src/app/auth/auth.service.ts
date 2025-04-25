import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUser } from '../layout/user/models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router) { }

  login(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, data, {
      withCredentials: true
    });
  }

  register(data: any): Observable<any> {
    return this.http.post<IUser>(`${environment.apiUrl}/auth/register`, data);
  }


  user(): Observable<IUser> {
    const token = localStorage.getItem("auth_id");
    let params = new HttpParams();
    if (token) {
      params = params.set("token", token);
    }

    return new Observable<IUser>((observer) => {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (
          parsedUser.expiration &&
          new Date(parsedUser.expiration) > new Date()
        ) {
          if (parsedUser.user.uuid !== '') {
            // Return the user from localStorage if it's still valid and uuid is not empty
            console.log("User from auth service 0", parsedUser.user);
            observer.next(parsedUser.user);
            observer.complete();
            return;
          } else {
            // Redirect to /auth/login if uuid is empty
            this.router.navigate(["/auth/login"]);
            observer.complete();
            return;
          }
        }
      }

      // Fetch the user from the server if no valid user is in localStorage
      this.http.get<IUser>(`${environment.apiUrl}/auth/user`, { params }).subscribe({
        next: (user) => {
          if (user.uuid === '') {
            // Redirect to /auth/login if uuid is empty
            this.router.navigate(["/auth/login"]);
            observer.complete();
            return;
          }

          console.log("User from auth service", user);

          const expiration = new Date();
          expiration.setDate(expiration.getDate() + 3); // Set expiration to 3 days from now
          const userWithExpiration = {
            user,
            expiration: expiration.toISOString()
          };

          // Save user and related foreign keys to localStorage
          localStorage.setItem("auth_user", JSON.stringify(userWithExpiration));

          localStorage.setItem("auth_asm", JSON.stringify(user.asm));
          localStorage.setItem("auth_sup", JSON.stringify(user.sup));
          localStorage.setItem("auth_dr", JSON.stringify(user.dr));
          localStorage.setItem("auth_cyclo", JSON.stringify(user.cyclo));


          observer.next(user);
          observer.complete();

          // Schedule removal of the user and related foreign keys after 3 days
          const expirationTime = expiration.getTime() - new Date().getTime();
          setTimeout(() => {
            const storedUser = localStorage.getItem("auth_user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              if (parsedUser.expiration && new Date(parsedUser.expiration) <= new Date()) {
                localStorage.removeItem("auth_user");
                this.router.navigate(["/auth/login"]);
              }
            }
          }, expirationTime);
        },
        error: (err) => {
          if (storedUser) {
            // If there's an error and a user is stored, return the stored user
            const parsedUser = JSON.parse(storedUser);
            observer.next(parsedUser.user);
            observer.complete();
          } else {
            observer.error(err);
            this.router.navigate(["/auth/login"]);
          }
        }
      });
    });
  }

  
  isTokenValid(): boolean {
    localStorage.removeItem("auth_user");
    const storedUser = localStorage.getItem("auth_user"); 
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const token = localStorage.getItem("auth_id");
      if (parsedUser.expiration && new Date(parsedUser.expiration) > new Date() && parsedUser.user.token === token) {
        return true; // Token is still valid and matches the stored token
      }
    }
    return false; // Token is invalid, expired, or does not match
  }

  logout(): Observable<void> {
    if (!navigator.onLine) {
      // If offline, clear local storage and redirect to login
      localStorage.removeItem('auth_id');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_asm');
      localStorage.removeItem('auth_sup');
      localStorage.removeItem('auth_dr');
      localStorage.removeItem('auth_cyclo');
      console.warn("User logged out due to offline status");
      this.router.navigate(["/auth/login"]);
      return new Observable<void>((observer) => {
        observer.complete();
      });
    }

    localStorage.removeItem('auth_id');
    localStorage.removeItem('auth_user');
    console.log("User logged out");
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap({
        next: () => {
          console.log("Logout successful");
          this.router.navigate(["/auth/login"]);
        },
        error: () => {
          console.error("Logout failed");
          // Ensure redirection even if the logout request fails
          this.router.navigate(["/auth/login"]);
        }
      })
    );
  }

  updateInfo(data: any): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/auth/profil/info`, data);
  }

  updatePassword(data: any): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/auth/change-password`, data);
  }

}