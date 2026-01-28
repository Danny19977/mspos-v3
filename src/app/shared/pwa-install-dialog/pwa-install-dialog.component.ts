import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlatformInfo, PwaInstallService } from '../../core/services/pwa-install.service';

@Component({
  selector: 'app-pwa-install-dialog',
  standalone: false,
  templateUrl: './pwa-install-dialog.component.html',
  styleUrls: ['./pwa-install-dialog.component.scss']
})
export class PwaInstallDialogComponent implements OnInit {
  platformInfo!: PlatformInfo;

  // Icônes spécifiques par plateforme
  platformIcons: { [key: string]: string } = {
    windows: 'bi-windows',
    mac: 'bi-apple',
    ios: 'bi-phone',
    android: 'bi-phone',
    other: 'bi-laptop'
  };

  constructor(
    public dialogRef: MatDialogRef<PwaInstallDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { platformInfo: PlatformInfo },
    private pwaService: PwaInstallService
  ) {
    this.platformInfo = data.platformInfo;
  }

  ngOnInit(): void {
    // Composant initialisé
  }

  /**
   * Déclenche l'installation automatique (Chrome/Edge)
   */
  async install(): Promise<void> {
    const result = await this.pwaService.installPwa();
    
    if (result.success) {
      this.pwaService.markAsInstalled();
      this.dialogRef.close({ installed: true });
    } else {
      // Fermer le dialog dans tous les cas
      this.dialogRef.close({ installed: false, dismissed: true });
    }
  }

  /**
   * Ferme le dialog et mémorise le choix
   */
  dismiss(): void {
    this.pwaService.dismissInstallPrompt();
    this.dialogRef.close({ installed: false, dismissed: true });
  }

  /**
   * Retourne le nom de la plateforme en français
   */
  getPlatformName(): string {
    const names: { [key: string]: string } = {
      windows: 'Windows',
      mac: 'macOS',
      ios: 'iOS',
      android: 'Android',
      other: 'votre appareil'
    };
    return names[this.platformInfo.name] || 'votre appareil';
  }

  /**
   * Retourne l'icône de la plateforme
   */
  getPlatformIcon(): string {
    return this.platformIcons[this.platformInfo.name] || this.platformIcons['other'];
  }
}
