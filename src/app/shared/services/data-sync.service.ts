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
   * Utilise les endpoints territoriaux corrects selon le rôle.
   */
  private async downloadUserPos(userId: string, userRole?: string): Promise<void> {
    try {
      const token = localStorage.getItem('auth_uuid');
      const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

      // Lire les données utilisateur depuis localStorage pour récupérer l'UUID territoire
      let storedUser: any = null;
      try {
        const raw = localStorage.getItem('auth_user');
        if (raw) storedUser = JSON.parse(raw);
      } catch { /* ignore */ }

      // Sélectionner le bon endpoint selon le rôle
      let apiUrl: string;
      if (userRole === 'ASM' && storedUser?.province_uuid) {
        apiUrl = `${environment.apiUrl}/pos/all/provinces/${storedUser.province_uuid}${tokenParam}`;
      } else if (userRole === 'Supervisor' && storedUser?.area_uuid) {
        apiUrl = `${environment.apiUrl}/pos/all/areas/${storedUser.area_uuid}${tokenParam}`;
      } else if (userRole === 'DR' && storedUser?.sub_area_uuid) {
        apiUrl = `${environment.apiUrl}/pos/all/subareas/${storedUser.sub_area_uuid}${tokenParam}`;
      } else if (userRole === 'Cyclo') {
        apiUrl = `${environment.apiUrl}/pos/all/cyclo/${userId}${tokenParam}`;
      } else {
        console.log('📦 POS : rôle non pris en charge pour le téléchargement automatique (Manager/Support ignoré).');
        return;
      }

      const response = await firstValueFrom(this.http.get<any>(apiUrl));
      const posList = response?.data || [];

      // Normaliser et stocker en local
      const posToStore = posList.map((pos: any) => ({
        ...pos,
        sync_status: 'synced',
        area_name: pos.area_name || (typeof pos.Area?.name === 'string' ? pos.Area.name : '') || '',
        subarea_name: pos.subarea_name || (typeof pos.SubArea?.name === 'string' ? pos.SubArea.name : '') || '',
        province_name: pos.province_name || (typeof pos.Province?.name === 'string' ? pos.Province.name : '') || '',
        commune_name: pos.commune_name || (typeof pos.Commune?.name === 'string' ? pos.Commune.name : '') || '',
        country_name: pos.country_name || (typeof pos.Country?.name === 'string' ? pos.Country.name : '') || ''
      }));

      await db.pos.clear();
      await db.pos.bulkPut(posToStore);
      console.log(`✅ ${posToStore.length} POS téléchargés et stockés (${userRole})`);
    } catch (error) {
      console.error('❌ Erreur téléchargement POS:', error);
      throw error;
    }
  }

  /**
   * Télécharge les RoutePlans de l'utilisateur
   * NOTE: l'endpoint /routeplans/user/:id retourne 404 — les routeplans
   * sont gérés localement via syncQueue. On évite de casser downloadInitialData.
   */
  private async downloadUserRoutePlans(userId: string): Promise<void> {
    console.log('📦 RoutePlans : source locale uniquement, étape de téléchargement ignorée (endpoint /user/:id non disponible).');
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
