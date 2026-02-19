import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap, from, throwError, of, firstValueFrom } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IUser } from '../layout/management/user/models/user.model';
import { Router } from '@angular/router';
import { LocalDbService } from '../services/local-db.service';
import { NetworkService } from '../services/network.service';
import { CryptoService } from '../services/crypto.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private router: Router,
    private localDb: LocalDbService,
    private networkService: NetworkService,
    private cryptoService: CryptoService
  ) { }

  /**
   * Authentification principale - gère les modes online et offline
   */
  login(data: any): Observable<any> {
    const isOnline = this.networkService.isOnline();

    if (isOnline) {
      // Mode ONLINE : appeler le backend
      return this.loginOnline(data);
    } else {
      // Mode OFFLINE : vérifier les identifiants localement
      return this.loginOffline(data);
    }
  }

  /**
   * Authentification ONLINE
   */
  private loginOnline(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, data, {
      withCredentials: true
    }).pipe(
      switchMap((res: any) => {
        // Sauvegarder le token dans localStorage (comme avant)
        localStorage.removeItem("auth_uuid");
        localStorage.setItem("auth_uuid", res.data);

        // Hasher le mot de passe et sauvegarder dans IndexedDB
        return from(this.saveUserLocally(data.identifier, data.password, res.data)).pipe(
          switchMap(() => of(res))
        );
      }),
      catchError(error => {
        console.error('❌ Erreur lors de l\'authentification online:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Authentification OFFLINE
   */
  private loginOffline(data: any): Observable<any> {
    return from(this.verifyOfflineCredentials(data.identifier, data.password)).pipe(
      switchMap(result => {
        if (result.success) {
          console.log('✅ Authentification offline réussie');
          
          // Restaurer le token depuis IndexedDB
          localStorage.removeItem("auth_uuid");
          localStorage.setItem("auth_uuid", result.token!);
          
          // Retourner une réponse simulée compatible avec le format attendu
          return of({
            data: result.token,
            message: 'Authentification offline réussie',
            offline: true
          });
        } else {
          console.error('❌ Échec de l\'authentification offline');
          return throwError(() => ({
            error: {
              message: 'Identifiants incorrects ou aucune donnée locale disponible'
            }
          }));
        }
      })
    );
  }

  /**
   * Vérifie les identifiants en mode offline
   */
  private async verifyOfflineCredentials(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; token?: string; userData?: any }> {
    try {
      // Normaliser l'identifier en lowercase pour la recherche
      const normalizedIdentifier = identifier.toLowerCase();
      const localUser = await this.localDb.getAuthenticatedUser(normalizedIdentifier);
      
      if (!localUser) {
        console.warn('⚠️ Aucun utilisateur local trouvé pour:', normalizedIdentifier);
        return { success: false };
      }

      // Hasher le mot de passe saisi et comparer
      const passwordHash = await this.cryptoService.hashPassword(password);
      
      if (passwordHash === localUser.passwordHash) {
        console.log('✅ Mot de passe correct pour l\'utilisateur local:', normalizedIdentifier);
        return {
          success: true,
          token: localUser.token,
          userData: localUser.userData
        };
      } else {
        console.warn('⚠️ Mot de passe incorrect pour l\'utilisateur local');
        return { success: false };
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification offline:', error);
      return { success: false };
    }
  }

  /**
   * Sauvegarde l'utilisateur localement après une authentification online réussie
   */
  private async saveUserLocally(
    identifier: string,
    password: string,
    token: string
  ): Promise<void> {
    try {
      console.log('🔄 Début de la sauvegarde locale pour:', identifier);
      
      // 1. Hasher le mot de passe
      const passwordHash = await this.cryptoService.hashPassword(password);
      console.log('✅ Mot de passe hashé');
      
      // 2. Récupérer les données utilisateur depuis le backend
      const userData = await this.getUserData(token);
      
      if (!userData) {
        console.error('❌ Impossible de récupérer les données utilisateur');
        throw new Error('Données utilisateur non récupérées');
      }
      console.log('✅ Données utilisateur récupérées:', userData);
      
      // 3. Sauvegarder dans IndexedDB
      await this.localDb.saveAuthenticatedUser(
        identifier,
        passwordHash,
        token,
        userData
      );
      console.log('✅ Utilisateur sauvegardé dans IndexedDB:', identifier);
      
      // 4. Vérifier que la sauvegarde a réussi
      const savedUser = await this.localDb.getAuthenticatedUser(identifier);
      if (savedUser) {
        console.log('✅ Vérification: utilisateur bien présent dans IndexedDB');
      } else {
        console.error('❌ ERREUR: utilisateur non trouvé après sauvegarde!');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde locale:', error);
      // On ne bloque pas le login même si la sauvegarde locale échoue
      // mais on log l'erreur pour diagnostic
    }
  }

  /**
   * Récupère les données utilisateur depuis le backend
   */
  private async getUserData(token: string): Promise<any> {
    try {
      let params = new HttpParams();
      params = params.set("token", token);
      
      console.log('🔄 Récupération des données utilisateur avec le token...');
      
      const user = await firstValueFrom(
        this.http.get<IUser>(
          `${environment.apiUrl}/auth/user`,
          { params }
        )
      );
      
      console.log('✅ Données utilisateur récupérées depuis le backend');
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
      throw error; // Relancer l'erreur au lieu de retourner null
    }
  }

  register(data: any): Observable<any> {
    return this.http.post<IUser>(`${environment.apiUrl}/auth/register`, data);
  }

  /**
   * Récupère les informations de l'utilisateur (online ou offline)
   */
  user(): Observable<IUser> {
    const token = localStorage.getItem("auth_uuid");
    
    if (this.networkService.isOnline()) {
      // Mode ONLINE : appeler le backend
      let params = new HttpParams();
      if (token) {
        params = params.set("token", token);
      }
      return this.http.get<IUser>(`${environment.apiUrl}/auth/user`, { params }).pipe(
        tap(user => {
          // Mettre à jour les données locales
          this.updateLocalUserData(user);
        })
      );
    } else {
      // Mode OFFLINE : récupérer depuis IndexedDB
      return from(this.getUserFromLocal()).pipe(
        switchMap(userData => {
          if (userData) {
            return of(userData as IUser);
          } else {
            return throwError(() => ({
              error: { message: 'Aucune donnée utilisateur locale disponible' }
            }));
          }
        })
      );
    }
  }

  /**
   * Récupère les données utilisateur depuis IndexedDB
   */
  private async getUserFromLocal(): Promise<any> {
    try {
      const localUser = await this.localDb.getStoredUser();
      return localUser?.userData || null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur local:', error);
      return null;
    }
  }

  /**
   * Met à jour les données utilisateur locales
   */
  private async updateLocalUserData(userData: IUser): Promise<void> {
    try {
      const localUser = await this.localDb.getStoredUser();
      if (localUser) {
        await this.localDb.updateUserData(localUser.identifier, userData);
        console.log('✅ Données utilisateur locales mises à jour');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des données locales:', error);
    }
  }


  isTokenValid(): boolean {
    localStorage.removeItem("auth_user");
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const token = localStorage.getItem("auth_uuid");
      if (parsedUser.expiration && new Date(parsedUser.expiration) > new Date() && parsedUser.user.token === token) {
        return true; // Token is still valid and matches the stored token
      }
    }
    return false; // Token is invalid, expired, or does not match
  }

  logout(): Observable<void> {
    // Nettoyer les données locales
    this.clearLocalData();

    if (!navigator.onLine) {
      // Si offline, seulement nettoyer et rediriger
      localStorage.removeItem('auth_id');
      localStorage.removeItem('auth_uuid');
      console.warn("User logged out due to offline status");
      this.router.navigate(["/auth/login"]);
      return new Observable<void>((observer) => {
        observer.complete();
      });
    }

    // Si online, appeler le backend
    localStorage.removeItem('auth_id');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_uuid');
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

  /**
   * Nettoie toutes les données locales (IndexedDB)
   */
  private async clearLocalData(): Promise<void> {
    try {
      await this.localDb.clearUser();
      console.log('✅ Données locales nettoyées');
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des données locales:', error);
    }
  }

  updateInfo(data: any): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/auth/profil/info`, data);
  }

  updatePassword(data: any): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/auth/change-password`, data);
  }

}