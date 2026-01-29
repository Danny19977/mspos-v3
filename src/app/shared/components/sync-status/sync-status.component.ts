import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '../../../services/network.service';
import { SyncQueueService } from '../../../shared/services/sync-queue.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-status-container">
      <!-- Network Status Badge -->
      <div class="network-badge" [class.online]="isOnline" [class.offline]="!isOnline">
        <span class="status-icon">{{ isOnline ? '🟢' : '🔴' }}</span>
        <span class="status-text">{{ isOnline ? 'En ligne' : 'Hors ligne' }}</span>
      </div>

      <!-- Pending Operations Counter -->
      <div class="pending-badge" *ngIf="pendingCount > 0" [class.syncing]="isSyncing">
        <span class="count">{{ pendingCount }}</span>
        <span class="label">{{ pendingCount === 1 ? 'opération en attente' : 'opérations en attente' }}</span>
      </div>

      <!-- Sync Status Indicator -->
      <div class="sync-indicator" *ngIf="isSyncing">
        <span class="spinner"></span>
        <span>Synchronisation...</span>
      </div>

      <!-- Manual Sync Button -->
      <button 
        class="sync-button" 
        *ngIf="isOnline && pendingCount > 0 && !isSyncing"
        (click)="manualSync()"
        title="Synchroniser maintenant">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        <span>Synchroniser</span>
      </button>

      <!-- Last Sync Time -->
      <div class="last-sync" *ngIf="lastSyncTime">
        <small>Dernière sync: {{ formatSyncTime(lastSyncTime) }}</small>
      </div>
    </div>
  `,
  styles: [`
    .sync-status-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      flex-wrap: wrap;
    }

    .network-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .network-badge.online {
      background: #d4edda;
      color: #155724;
    }

    .network-badge.offline {
      background: #f8d7da;
      color: #721c24;
    }

    .status-icon {
      font-size: 10px;
    }

    .pending-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 16px;
      background: #fff3cd;
      color: #856404;
      font-size: 13px;
      animation: pulse 2s infinite;
    }

    .pending-badge.syncing {
      background: #cfe2ff;
      color: #084298;
    }

    .pending-badge .count {
      font-weight: bold;
      background: #ffc107;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
    }

    .sync-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #0d6efd;
      font-size: 13px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e3e3e3;
      border-top-color: #0d6efd;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .sync-button {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: #0d6efd;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .sync-button:hover {
      background: #0b5ed7;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(13,110,253,0.3);
    }

    .sync-button:active {
      transform: translateY(0);
    }

    .last-sync {
      color: #6c757d;
      font-size: 12px;
      margin-left: auto;
    }

    @media (max-width: 768px) {
      .sync-status-container {
        padding: 6px 12px;
        gap: 8px;
      }

      .network-badge, .pending-badge, .sync-indicator {
        font-size: 12px;
      }

      .sync-button {
        padding: 5px 10px;
        font-size: 12px;
      }

      .last-sync {
        width: 100%;
        text-align: center;
        margin-left: 0;
      }
    }
  `]
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  isOnline: boolean = true;
  pendingCount: number = 0;
  isSyncing: boolean = false;
  lastSyncTime: Date | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private networkService: NetworkService,
    private syncQueue: SyncQueueService
  ) {}

  ngOnInit(): void {
    // Monitor network status
    this.networkService.getNetworkStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        this.isOnline = isOnline;
      });

    // Monitor pending operations count
    this.syncQueue.pendingCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.pendingCount = count;
      });

    // Monitor sync status
    this.syncQueue.isSyncing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isSyncing => {
        this.isSyncing = isSyncing;
      });

    // Monitor last sync time
    this.syncQueue.lastSyncTime$
      .pipe(takeUntil(this.destroy$))
      .subscribe(time => {
        this.lastSyncTime = time;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async manualSync(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    try {
      await this.syncQueue.processQueue();
    } catch (error) {
      console.error('Error during manual sync:', error);
    }
  }

  formatSyncTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes === 1) return 'Il y a 1 minute';
    if (minutes < 60) return `Il y a ${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Il y a 1 heure';
    if (hours < 24) return `Il y a ${hours} heures`;
    
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
