import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable()
export class CredentialInterceptor implements HttpInterceptor { 
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!navigator.onLine) {
      // If offline, do not intercept the request
      return next.handle(request);
    }

    // const token = localStorage.getItem("auth_uuid");
    // if (token && this.authService.isTokenValid()) {
    //   return next.handle(request); // Skip adding credentials if token is valid
    // }

    const req = request.clone({
      withCredentials: true
    });
    return next.handle(req);
  }
}