import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public online$: Observable<boolean> = this.onlineSubject.asObservable();

  constructor() {
    // Écouter les événements online/offline du navigateur
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      console.log(`📡 État de connexion: ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
      this.onlineSubject.next(isOnline);
    });
  }

  /**
   * Retourne l'état actuel de la connexion
   */
  isOnline(): boolean {
    return this.onlineSubject.value;
  }

  /**
   * Retourne un Observable de l'état de connexion
   */
  getNetworkStatus(): Observable<boolean> {
    return this.online$;
  }

  /**
   * Attend que la connexion soit rétablie
   */
  waitForOnline(): Observable<boolean> {
    if (this.isOnline()) {
      return of(true);
    }
    return this.online$.pipe(
      map(isOnline => isOnline)
    );
  }
}
