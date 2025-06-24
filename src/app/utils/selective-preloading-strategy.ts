import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable()
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  
  preload(route: Route, fn: () => Observable<any>): Observable<any> {
    // Preload seulement les routes marquées avec data: { preload: true }
    if (route.data && route.data['preload']) {
      return fn();
    }
    return of(null);
  }
}
