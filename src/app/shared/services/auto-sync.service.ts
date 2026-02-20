import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, interval, merge } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { NetworkService } from '../../services/network.service';
import { SyncQueueService } from './sync-queue.service';
import { DataSyncService } from './data-sync.service';

/**
 * AutoSyncService - Gère la synchronisation automatique en arrière-plan
 * 
 * - Écoute les changements de connectivité (offline -> online)
 * - Lance automatiquement la synchronisation de la file d'attente quand la connexion est rétablie
 * - Synchronise périodiquement (toutes les 5 minutes) si online
 * - Télécharge les données initiales au premier démarrage si nécessaire
 */
@Injectable({
  providedIn: 'root'
})
export class AutoSyncService implements OnDestroy {
  private subscriptions: Subscription[] = [];
  private syncInterval = 5 * 60 * 1000; // 5 minutes
  private isSyncing = false;

  constructor(
    private networkService: NetworkService,
    private syncQueue: SyncQueueService,
    private dataSync: DataSyncService
  ) {}

  /**
   * Démarre la synchronisation automatique
   */
  start(): void {
    console.log('🔄 AutoSync: Démarrage de la synchronisation automatique');

    // 1. Synchroniser immédiatement si online et qu'il y a des opérations en attente
    if (this.networkService.isOnline()) {
      this.syncNow();
    }

    // 2. Écouter les changements de connectivité (offline -> online)
    const networkSub = this.networkService.online$
      .pipe(
        filter(isOnline => isOnline === true) // Seulement quand on passe à online
      )
      .subscribe(() => {
        console.log('📡 Connexion rétablie, lancement de la synchronisation...');
        this.syncNow();
      });
    this.subscriptions.push(networkSub);

    // 3. Synchronisation périodique (toutes les 5 minutes) si online
    const intervalSub = interval(this.syncInterval)
      .pipe(
        filter(() => this.networkService.isOnline() && !this.isSyncing),
        switchMap(() => this.syncQueue.getPendingCount())
      )
      .subscribe(pendingCount => {
        if (pendingCount > 0) {
          console.log(`⏰ Synchronisation périodique: ${pendingCount} opération(s) en attente`);
          this.syncNow();
        }
      });
    this.subscriptions.push(intervalSub);

    console.log('✅ AutoSync: Service de synchronisation automatique démarré');
  }

  /**
   * Lance une synchronisation immédiate
   */
  async syncNow(): Promise<void> {
    if (this.isSyncing) {
      console.log('⏸️ Synchronisation déjà en cours, ignoré');
      return;
    }

    if (!this.networkService.isOnline()) {
      console.log('📴 Hors ligne, synchronisation impossible');
      return;
    }

    this.isSyncing = true;
    console.log('🔄 Début de la synchronisation...');

    try {
      // Remettre en attente les opérations échouées (max 3 tentatives)
      await this.syncQueue.retryFailedOperations();

      // Traiter la file d'attente
      const result = await this.syncQueue.processQueue();
      
      if (result.success > 0 || result.failed > 0) {
        console.log(`✅ Synchronisation terminée: ${result.success} réussie(s), ${result.failed} échouée(s)`);
      }

      // Nettoyer les opérations terminées anciennes
      await this.syncQueue.clearOldCompletedOperations();
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Télécharge les données initiales si nécessaire
   */
  async downloadInitialDataIfNeeded(userId: string, userRole?: string): Promise<void> {
    if (!this.networkService.isOnline()) {
      console.log('📴 Hors ligne, téléchargement initial reporté');
      return;
    }

    try {
      const hasLocalData = await this.dataSync.hasLocalData();
      
      if (!hasLocalData) {
        console.log('📥 Aucune donnée locale trouvée, téléchargement initial...');
        await this.dataSync.downloadInitialData(userId, userRole);
        console.log('✅ Téléchargement initial terminé');
      } else {
        console.log('✓ Données locales déjà présentes');
        
        // Vérifier si les données sont anciennes (> 24h)
        const lastSync = this.dataSync.getLastSyncTime();
        if (lastSync) {
          const hoursSinceLastSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastSync > 24) {
            console.log(`⏰ Dernière synchronisation il y a ${Math.round(hoursSinceLastSync)}h, rafraîchissement...`);
            await this.dataSync.refreshData(userId, userRole);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du téléchargement initial:', error);
    }
  }

  /**
   * Force un rafraîchissement complet des données
   */
  async forceRefresh(userId: string, userRole?: string): Promise<void> {
    if (!this.networkService.isOnline()) {
      throw new Error('Connexion Internet requise pour rafraîchir les données');
    }

    console.log('🔄 Rafraîchissement forcé des données...');
    await this.dataSync.refreshData(userId, userRole);
    console.log('✅ Données rafraîchies avec succès');
  }

  /**
   * Obtient le nombre d'opérations en attente
   */
  async getPendingOperationsCount(): Promise<number> {
    return await this.syncQueue.getPendingCount();
  }

  /**
   * Obtient les statistiques de synchronisation
   */
  async getSyncStats(): Promise<{
    pendingCount: number;
    lastSyncTime: Date | null;
    isOnline: boolean;
    isSyncing: boolean;
  }> {
    const pendingCount = await this.syncQueue.getPendingCount();
    const lastSyncTime = this.dataSync.getLastSyncTime();
    
    return {
      pendingCount,
      lastSyncTime,
      isOnline: this.networkService.isOnline(),
      isSyncing: this.isSyncing
    };
  }

  /**
   * Arrête la synchronisation automatique
   */
  stop(): void {
    console.log('🛑 AutoSync: Arrêt de la synchronisation automatique');
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Nettoyage lors de la destruction du service
   */
  ngOnDestroy(): void {
    this.stop();
  }

  /**
   * Réessaie les opérations échouées
   */
  async retryFailedOperations(): Promise<void> {
    console.log('🔄 Réessai des opérations échouées...');
    await this.syncQueue.retryFailedOperations();
    
    if (this.networkService.isOnline()) {
      await this.syncNow();
    }
  }

  /**
   * Configure l'intervalle de synchronisation (en millisecondes)
   */
  setSyncInterval(intervalMs: number): void {
    if (intervalMs < 60000) { // Minimum 1 minute
      console.warn('⚠️ Intervalle de synchronisation trop court, minimum 1 minute');
      intervalMs = 60000;
    }
    
    this.syncInterval = intervalMs;
    console.log(`⏰ Intervalle de synchronisation défini à ${intervalMs / 1000}s`);
    
    // Redémarrer le service pour appliquer le nouvel intervalle
    this.stop();
    this.start();
  }
}
