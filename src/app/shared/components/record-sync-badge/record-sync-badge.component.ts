import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-record-sync-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span 
      class="sync-badge" 
      [class.synced]="syncStatus === 'synced'"
      [class.pending]="syncStatus === 'pending'"
      [class.error]="syncStatus === 'error'"
      [class.offline]="syncStatus === 'offline'"
      [title]="getTooltip()">
      <span class="icon">{{ getIcon() }}</span>
      <span class="label" *ngIf="showLabel">{{ getLabel() }}</span>
    </span>
  `,
  styles: [`
    .sync-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }

    .sync-badge.synced {
      background: #d4edda;
      color: #155724;
    }

    .sync-badge.pending {
      background: #fff3cd;
      color: #856404;
      animation: pulse 2s infinite;
    }

    .sync-badge.error {
      background: #f8d7da;
      color: #721c24;
    }

    .sync-badge.offline {
      background: #e2e3e5;
      color: #383d41;
    }

    .icon {
      font-size: 10px;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    @media (max-width: 768px) {
      .label {
        display: none;
      }
    }
  `]
})
export class RecordSyncBadgeComponent {
  @Input() syncStatus: 'synced' | 'pending' | 'error' | 'offline' | undefined;
  @Input() showLabel: boolean = false;

  getIcon(): string {
    switch (this.syncStatus) {
      case 'synced':
        return '✓';
      case 'pending':
        return '⏳';
      case 'error':
        return '⚠';
      case 'offline':
        return '📴';
      default:
        return '•';
    }
  }

  getLabel(): string {
    switch (this.syncStatus) {
      case 'synced':
        return 'Synchronisé';
      case 'pending':
        return 'En attente';
      case 'error':
        return 'Erreur';
      case 'offline':
        return 'Hors ligne';
      default:
        return 'Inconnu';
    }
  }

  getTooltip(): string {
    switch (this.syncStatus) {
      case 'synced':
        return 'Données synchronisées avec le serveur';
      case 'pending':
        return 'En attente de synchronisation';
      case 'error':
        return 'Erreur lors de la synchronisation';
      case 'offline':
        return 'Créé hors ligne';
      default:
        return '';
    }
  }
}
