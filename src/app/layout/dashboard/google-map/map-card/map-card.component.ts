import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild, inject, signal } from '@angular/core';
import { GoogleMapModel } from '../../models/dashboard.models';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../../../services/google-maps-loader.service';

// ─── DRC province centres ──────────────────────────────────────────────────────
interface ProvinceMeta { center: google.maps.LatLngLiteral; zoom: number; }

/** Centre géographique de la RDC + zoom pour voir tout le pays. */
const DRC_CENTER: ProvinceMeta = { center: { lat: -4.0, lng: 24.0 }, zoom: 5 };

const PROVINCE_CENTERS: Record<string, ProvinceMeta> = {
  'Kinshasa':        { center: { lat: -4.3245,  lng: 15.3222  }, zoom: 12 },
  'Kongo-Central':   { center: { lat: -5.0000,  lng: 13.8000  }, zoom:  8 },
  'Kongo Central':   { center: { lat: -5.0000,  lng: 13.8000  }, zoom:  8 },
  'Bas-Congo':       { center: { lat: -5.0000,  lng: 13.8000  }, zoom:  8 },
  'Kwango':          { center: { lat: -5.5000,  lng: 16.5000  }, zoom:  8 },
  'Kwilu':           { center: { lat: -5.0000,  lng: 18.5000  }, zoom:  8 },
  'Mai-Ndombe':      { center: { lat: -2.5000,  lng: 18.5000  }, zoom:  8 },
  'Équateur':        { center: { lat:  0.5000,  lng: 22.0000  }, zoom:  8 },
  'Equateur':        { center: { lat:  0.5000,  lng: 22.0000  }, zoom:  8 },
  'Mongala':         { center: { lat:  2.5000,  lng: 21.5000  }, zoom:  8 },
  'Nord-Ubangi':     { center: { lat:  4.0000,  lng: 21.5000  }, zoom:  8 },
  'Sud-Ubangi':      { center: { lat:  3.0000,  lng: 19.5000  }, zoom:  8 },
  'Tshuapa':         { center: { lat: -0.5000,  lng: 23.5000  }, zoom:  8 },
  'Tshopo':          { center: { lat:  0.0000,  lng: 25.0000  }, zoom:  8 },
  'Bas-Uélé':        { center: { lat:  4.0000,  lng: 25.0000  }, zoom:  8 },
  'Bas-Uele':        { center: { lat:  4.0000,  lng: 25.0000  }, zoom:  8 },
  'Haut-Uélé':       { center: { lat:  3.5000,  lng: 28.0000  }, zoom:  8 },
  'Haut-Uele':       { center: { lat:  3.5000,  lng: 28.0000  }, zoom:  8 },
  'Ituri':           { center: { lat:  1.5000,  lng: 29.0000  }, zoom:  8 },
  'Nord-Kivu':       { center: { lat: -0.5000,  lng: 29.0000  }, zoom:  9 },
  'Sud-Kivu':        { center: { lat: -2.5000,  lng: 28.5000  }, zoom:  9 },
  'Maniema':         { center: { lat: -3.5000,  lng: 26.5000  }, zoom:  8 },
  'Lomami':          { center: { lat: -5.5000,  lng: 25.0000  }, zoom:  8 },
  'Sankuru':         { center: { lat: -3.0000,  lng: 24.0000  }, zoom:  8 },
  'Kasaï':           { center: { lat: -5.0000,  lng: 21.5000  }, zoom:  8 },
  'Kasai':           { center: { lat: -5.0000,  lng: 21.5000  }, zoom:  8 },
  'Kasaï-Central':   { center: { lat: -6.0000,  lng: 22.5000  }, zoom:  8 },
  'Kasai-Central':   { center: { lat: -6.0000,  lng: 22.5000  }, zoom:  8 },
  'Kasaï-Oriental':  { center: { lat: -5.5000,  lng: 23.5000  }, zoom:  8 },
  'Kasai-Oriental':  { center: { lat: -5.5000,  lng: 23.5000  }, zoom:  8 },
  'Lualaba':         { center: { lat: -10.0000, lng: 25.5000  }, zoom:  8 },
  'Haut-Katanga':    { center: { lat: -11.0000, lng: 27.5000  }, zoom:  8 },
  'Haut-Lomami':     { center: { lat: -8.0000,  lng: 28.0000  }, zoom:  8 },
  'Tanganyika':      { center: { lat: -6.5000,  lng: 29.0000  }, zoom:  8 },
};

/** Case-insensitive partial lookup fallback. */
function findProvinceByName(name: string): ProvinceMeta | null {
  const lower = name.toLowerCase();
  const key = Object.keys(PROVINCE_CENTERS).find(k => k.toLowerCase() === lower
    || lower.includes(k.toLowerCase()) || k.toLowerCase().includes(lower));
  return key ? PROVINCE_CENTERS[key] : null;
}

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
  @Input() selectedProvinceName: string = '';
  @ViewChild('infoWindow', { read: MapInfoWindow, static: false }) infoWindow!: MapInfoWindow;

  // ─── Services ─────────────────────────────────────────────────────────────
  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);

  // ─── Signals ──────────────────────────────────────────────────────────────
  readonly hasMapError    = signal(false);
  readonly mapErrorMessage = signal('');
  readonly mapHeight      = signal('800px');
  readonly mapWidth       = signal('1100px');
  readonly center         = signal<google.maps.LatLngLiteral>(DRC_CENTER.center);
  readonly zoom           = signal(DRC_CENTER.zoom);
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
    const listChanged     = !!changes['googleMapList'];
    const provinceChanged = !!changes['selectedProvinceName'];

    if (!listChanged && !provinceChanged) return;

    // ─── Rebuild markers when the list changes ────────────────────────────
    if (listChanged) {
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
      } else {
        this.markers.set([]);
      }
    }

    // ─── Update map centre based on province selection ────────────────────
    this.updateMapCenter();
  }

  /**
   * Centers the map on the selected province.
   * When no province is selected, zooms out to show the full DRC.
   */
  private updateMapCenter(): void {
    const name = this.selectedProvinceName?.trim();

    if (name) {
      // Exact match first, then partial/case-insensitive fallback
      const meta = PROVINCE_CENTERS[name] ?? findProvinceByName(name);
      if (meta) {
        this.center.set(meta.center);
        this.zoom.set(meta.zoom);
        return;
      }
    }

    // No province selected → zoom out to show the full DRC
    this.center.set(DRC_CENTER.center);
    this.zoom.set(DRC_CENTER.zoom);
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
