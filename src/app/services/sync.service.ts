import { Injectable } from '@angular/core';
import { NetworkService } from './network.service';
import { LocalDbService } from './local-db.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SyncService {
  private isSyncing = false;

  constructor(
    private networkService: NetworkService,
    private localDb: LocalDbService,
    private http: HttpClient
  ) {
    this.initAutoSync();
  }

  /**
   * Initialise la synchronisation automatique quand la connexion revient
   */
  private initAutoSync(): void {
    this.networkService.getNetworkStatus()
      .pipe(
        filter(isOnline => isOnline) // Seulement quand on passe à online
      )
      .subscribe(() => {
        console.log('🔄 Connexion rétablie, synchronisation en cours...');
        this.syncUserData();
      });
  }

  /**
   * Synchronise les données utilisateur avec le backend
   */
  async syncUserData(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏳ Synchronisation déjà en cours...');
      return;
    }

    this.isSyncing = true;

    try {
      const localUser = await this.localDb.getStoredUser();
      
      if (!localUser) {
        console.log('ℹ️ Aucun utilisateur local à synchroniser');
        this.isSyncing = false;
        return;
      }

      // Vérifier si le token est toujours valide
      const token = localStorage.getItem('auth_uuid');
      
      if (!token || token !== localUser.token) {
        console.warn('⚠️ Token local différent du localStorage, mise à jour...');
        await this.localDb.updateToken(localUser.identifier, token || '');
      }

      // Récupérer les données utilisateur fraîches depuis le backend
      let params = new HttpParams();
      if (token) {
        params = params.set("token", token);
      }

      this.http.get<any>(`${environment.apiUrl}/auth/user`, { params })
        .subscribe({
          next: async (userData) => {
            // Mettre à jour les données locales
            await this.localDb.updateUserData(localUser.identifier, userData);
            console.log('✅ Synchronisation réussie:', localUser.identifier);
            this.isSyncing = false;
          },
          error: async (error) => {
            console.error('❌ Erreur lors de la synchronisation:', error);
            
            // Si le token est invalide, nettoyer les données locales
            if (error.status === 401 || error.status === 403) {
              console.warn('⚠️ Token invalide, nettoyage des données locales...');
              await this.localDb.clearUser();
              localStorage.removeItem('auth_uuid');
              localStorage.removeItem('auth_id');
            }
            
            this.isSyncing = false;
          }
        });

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      this.isSyncing = false;
    }
  }

  /**
   * Force une synchronisation manuelle
   */
  forceSync(): void {
    if (this.networkService.isOnline()) {
      this.syncUserData();
    } else {
      console.warn('⚠️ Impossible de synchroniser en mode offline');
    }
  }

  /**
   * Vérifie si une synchronisation est en cours
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }
}
