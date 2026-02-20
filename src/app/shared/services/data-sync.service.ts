import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { db } from './db';
import { environment } from '../../../environments/environment';
import { NetworkService } from '../../services/network.service';

export interface SyncProgress {
  total: number;
  current: number;
  entity: string;
  isComplete: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataSyncService {
  private _syncProgress$ = new BehaviorSubject<SyncProgress>({
    total: 0,
    current: 0,
    entity: '',
    isComplete: true
  });
  public syncProgress$ = this._syncProgress$.asObservable();

  private _lastDataSync$ = new BehaviorSubject<Date | null>(null);
  public lastDataSync$ = this._lastDataSync$.asObservable();

  constructor(
    private http: HttpClient,
    private networkService: NetworkService
  ) {
    this.loadLastSyncTime();
  }

  /**
   * Télécharge toutes les données initiales nécessaires
   */
  async downloadInitialData(userId: string, userRole?: string): Promise<void> {
    if (!this.networkService.isOnline()) {
      console.log('📴 Offline: Impossible de télécharger les données initiales');
      throw new Error('Connexion Internet requise pour le téléchargement initial');
    }

    console.log('🔄 Début du téléchargement des données initiales...');

    try {
      const steps = 3; // Brands, POS, RoutePlans
      let currentStep = 0;

      // 1. Télécharger les Brands
      this.updateProgress(currentStep++, steps, 'Brands');
      await this.downloadBrands();

      // 2. Télécharger les POS pour cet utilisateur
      this.updateProgress(currentStep++, steps, 'Points de Vente');
      await this.downloadUserPos(userId, userRole);

      // 3. Télécharger les RoutePlans de l'utilisateur
      this.updateProgress(currentStep++, steps, 'Plans de Route');
      await this.downloadUserRoutePlans(userId);

      // Marquer comme terminé
      this.updateProgress(steps, steps, 'Terminé', true);
      
      // Sauvegarder le timestamp de la dernière synchronisation
      const now = new Date();
      localStorage.setItem('last_data_sync', now.toISOString());
      this._lastDataSync$.next(now);

      console.log('✅ Téléchargement des données initiales terminé');
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement des données:', error);
      this.updateProgress(0, 0, 'Erreur', true);
      throw error;
    }
  }

  /**
   * Télécharge tous les Brands et les stocke en local
   */
  private async downloadBrands(): Promise<void> {
    try {
      const token = localStorage.getItem('auth_uuid');
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/brands${tokenParam}`)
      );

      const brands = response?.data || [];
      
      // Marquer tous comme synchronisés et stocker en local
      const brandsToStore = brands.map((brand: any) => ({
        ...brand,
        sync_status: 'synced',
        id: brand.ID || brand.id
      }));

      // Vider la table et insérer les nouvelles données
      await db.brands.clear();
      await db.brands.bulkPut(brandsToStore);

      console.log(`✅ ${brandsToStore.length} Brands téléchargés et stockés`);
    } catch (error) {
      console.error('❌ Erreur téléchargement Brands:', error);
      throw error;
    }
  }

  /**
   * Télécharge les POS pour l'utilisateur selon son rôle
   */
  private async downloadUserPos(userId: string, userRole?: string): Promise<void> {
    try {
      const token = localStorage.getItem('auth_uuid');
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

      // L'endpoint backend doit filtrer selon le rôle de l'utilisateur
      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/pos/user/${userId}${tokenParam}`)
      );

      const posList = response?.data || [];

      // Marquer tous comme synchronisés et stocker en local
      const posToStore = posList.map((pos: any) => ({
        ...pos,
        sync_status: 'synced',
        id: pos.ID || pos.id
      }));

      // Vider la table et insérer les nouvelles données
      await db.pos.clear();
      await db.pos.bulkPut(posToStore);

      console.log(`✅ ${posToStore.length} POS téléchargés et stockés`);
    } catch (error) {
      console.error('❌ Erreur téléchargement POS:', error);
      throw error;
    }
  }

  /**
   * Télécharge les RoutePlans de l'utilisateur
   */
  private async downloadUserRoutePlans(userId: string): Promise<void> {
    try {
      const token = localStorage.getItem('auth_uuid');
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

      const response = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/routeplans/user/${userId}${tokenParam}`)
      );

      const routePlans = response?.data || [];

      // Marquer tous comme synchronisés et stocker en local
      const routePlansToStore = routePlans.map((plan: any) => ({
        ...plan,
        sync_status: 'synced',
        id: plan.ID || plan.id
      }));

      // Vider la table et insérer les nouvelles données
      await db.routePlans.clear();
      await db.routePlans.bulkPut(routePlansToStore);

      console.log(`✅ ${routePlansToStore.length} RoutePlans téléchargés et stockés`);
    } catch (error) {
      console.error('❌ Erreur téléchargement RoutePlans:', error);
      throw error;
    }
  }

  /**
   * Recharge les données depuis le serveur
   */
  async refreshData(userId: string, userRole?: string): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Connexion Internet requise pour actualiser les données');
    }

    return this.downloadInitialData(userId, userRole);
  }

  /**
   * Vérifie si les données ont déjà été téléchargées
   */
  async hasLocalData(): Promise<boolean> {
    const brandsCount = await db.brands.count();
    const posCount = await db.pos.count();
    return brandsCount > 0 && posCount > 0;
  }

  /**
   * Met à jour la progression
   */
  private updateProgress(current: number, total: number, entity: string, isComplete: boolean = false): void {
    this._syncProgress$.next({
      current,
      total,
      entity,
      isComplete
    });
  }

  /**
   * Charge le dernier timestamp de synchronisation
   */
  private loadLastSyncTime(): void {
    const lastSync = localStorage.getItem('last_data_sync');
    if (lastSync) {
      this._lastDataSync$.next(new Date(lastSync));
    }
  }

  /**
   * Obtient la dernière date de synchronisation
   */
  getLastSyncTime(): Date | null {
    return this._lastDataSync$.value;
  }
}
