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
    return this.http.get<IUser>(`${environment.apiUrl}/auth/user`);
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