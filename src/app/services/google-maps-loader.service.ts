import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() { }

  loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = new Promise<void>((resolve, reject) => {
      // Check if Google Maps is already loaded (from index.html)
      if (typeof google === 'object' && typeof google.maps === 'object') {
        this.isLoaded = true;
        console.log('Google Maps API already loaded from static script');
        resolve();
        return;
      }

      // If not loaded, wait a bit for the static script to load
      const checkInterval = setInterval(() => {
        if (typeof google === 'object' && typeof google.maps === 'object') {
          this.isLoaded = true;
          console.log('Google Maps API loaded successfully');
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isLoaded) {
          clearInterval(checkInterval);
          const error = 'Google Maps API failed to load. Please check your API key and network connection.';
          console.error(error);
          reject(new Error(error));
        }
      }, 10000);
    });

    return this.loadingPromise;
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded;
  }
}
