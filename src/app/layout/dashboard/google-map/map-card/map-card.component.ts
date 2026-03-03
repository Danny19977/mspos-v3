import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { GoogleMapModel } from '../../models/dashboard.models';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../../../services/google-maps-loader.service';

interface Marker {
  position: google.maps.LatLngLiteral;
  name: string;
  label: string;
  icon: google.maps.Icon;   // pre-computed — never changes reference after build
  zIndex?: number;
  category: string;
  role: string;        // 'asm' | 'supervisor' | 'dr' | 'cyclo' | 'unknown'
  asm: string;
  sup: string;
  dr: string;
  cyclo: string;
  date: string;
  signature: string;
  url?: string;
}

// ─── Role colour palette ───────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  asm:        '#F44336', // Red
  supervisor: '#2196F3', // Blue
  dr:         '#4CAF50', // Green
  cyclo:      '#FF9800', // Orange
};


@Component({
  selector: 'app-map-card',
  standalone: false,
  templateUrl: './map-card.component.html',
  styleUrl: './map-card.component.scss'
})
export class MapCardComponent implements OnInit, OnChanges {
  @Input() isLoading!: boolean;
  @Input() googleMapList: GoogleMapModel[] = [];
  @ViewChild('infoWindow', { read: MapInfoWindow, static: false }) infoWindow!: MapInfoWindow;

  // ─── Services ─────────────────────────────────────────────────────────────
  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly hasMapError    = signal(false);
  readonly mapErrorMessage = signal('');
  readonly mapHeight      = signal('800px');
  readonly mapWidth       = signal('1100px');
  readonly center         = signal<google.maps.LatLngLiteral>({ lat: -4.350900786588518, lng: 15.32577513250754 });
  readonly zoom           = signal(12);
  readonly markers        = signal<Marker[]>([]);
  readonly selectedMarker = signal<Marker | null>(null);

  // ─── Role labels ──────────────────────────────────────────────────────────
  readonly roleLabels: Record<string, string> = {
    asm:        'ASM',
    supervisor: 'Superviseur',
    dr:         'DR',
    cyclo:      'Cyclo',
    unknown:    'Inconnu',
  };

  /** Returns a colored SVG pin icon for each role (call only from ngOnChanges). */
  private buildMarkerIcon(role: string): google.maps.Icon {
    const fill  = ROLE_COLORS[role] ?? '#9E9E9E';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 11.6 16 26 16 26S32 27.6 32 16C32 7.163 24.837 0 16 0z" fill="${fill}" stroke="rgba(0,0,0,0.25)" stroke-width="1"/>
      <circle cx="16" cy="16" r="7" fill="#ffffff" opacity="0.9"/>
    </svg>`;
    return {
      url:        'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 42),
      anchor:     new google.maps.Point(16, 42),
    };
  }

  /** @deprecated kept for template — use marker.icon directly instead. */
  getMarkerIcon(role: string): google.maps.Icon {
    return this.buildMarkerIcon(role);
  }

  /** CSS color for role (used in template). */
  roleColor(role: string): string {
    return ROLE_COLORS[role] ?? '#9E9E9E';
  }

  ngOnInit(): void {
    this.googleMapsLoader.loadGoogleMaps()
      .then(() => {
        this.calculateMapDimensions();
        this.hasMapError.set(false);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        this.hasMapError.set(true);
        this.mapErrorMessage.set('Impossible de charger Google Maps. Vérifiez votre clé API.');
      });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.calculateMapDimensions();
  }

  private calculateMapDimensions(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;

    let width = '1100px', height = '800px';
    if      (w <= 576)  { width = '100%'; height = '400px'; }
    else if (w <= 768)  { width = '100%'; height = '500px'; }
    else if (w <= 992)  { width = '100%'; height = '600px'; }
    else if (w <= 1200) { width = '95%';  height = '700px'; }

    if (h < 700) {
      height = Math.min(parseInt(height), h * 0.6) + 'px';
    }
    this.mapWidth.set(width);
    this.mapHeight.set(height);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['googleMapList']) return;

    if (this.googleMapList?.length > 0) {
      const built = this.googleMapList.map(el => ({
        position:  { lat: el.latitude, lng: el.longitude },
        name:      el.pos_name,
        label:     el.pos_name,
        icon:      this.buildMarkerIcon(el.role || 'unknown'),
        category:  el.postype,
        role:      el.role || 'unknown',
        asm:       el.asm   || '',
        sup:       el.sup   || '',
        dr:        el.dr    || '',
        cyclo:     el.cyclo || '',
        date:      el.created_at,
        signature: el.signature,
        url:       el.pos_uuid,
      }));
      this.markers.set(built);

      const latSum = built.reduce((s, m) => s + m.position.lat, 0);
      const lngSum = built.reduce((s, m) => s + m.position.lng, 0);
      this.center.set({ lat: latSum / built.length, lng: lngSum / built.length });
    } else {
      this.markers.set([]);
    }
  }

  /** Stable trackBy so Angular reuses existing <map-marker> DOM nodes. */
  trackByMarker(_index: number, m: Marker): string {
    return `${m.position.lat},${m.position.lng},${m.role}`;
  }


  openInfoWindow(markerData: Marker, markerRef: MapMarker): void {
    this.selectedMarker.set(markerData);
    if (this.infoWindow && typeof this.infoWindow.open === 'function') {
      this.infoWindow.open(markerRef);
    }
  }

  closeInfoWindowManual(): void {
    this.infoWindow?.close();
    this.selectedMarker.set(null);
  }

}
