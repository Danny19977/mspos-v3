import { Component, Input, OnChanges, SimpleChanges, ViewChild, AfterViewInit, ElementRef, input, HostListener, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { _isNumberValue } from '@angular/cdk/coercion';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GoogleMapModel } from '../../../../../dashboard/models/dashboard.models';
import { GoogleMapsLoaderService } from '../../../../../../services/google-maps-loader.service';

interface Marker {
  position: google.maps.LatLngLiteral;
  name: string;
  label: string;
  icon?: string | google.maps.Icon;
  zIndex?: number;
  category: string;
  asm: string; // Province of the NameCentre
  sup: string;
  dr: string;
  cyclo: string;
  date: string;
  signature: string;
}


@Component({
  selector: 'app-map-pos-card',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './map-pos-card.component.html',
  styleUrl: './map-pos-card.component.scss'
})
export class MapPosCardComponent implements OnInit {
  // Services avec inject()
  private readonly googleMapsLoader = inject(GoogleMapsLoaderService);

  @Input() isLoading!: boolean;
  @Input() googleMapList: GoogleMapModel[] = [];
  @ViewChild('infoWindow', { read: MapInfoWindow, static: false }) infoWindow!: MapInfoWindow;

  // Signals pour l'état du composant
  readonly mapHeight = signal('800px');
  readonly mapWidth = signal('1100px');
  readonly hasMapError = signal(false);
  readonly mapErrorMessage = signal('');
  readonly selectedMarker = signal<Marker | null>(null);
  readonly center = signal<google.maps.LatLngLiteral>({ lat: -4.4419, lng: 15.2663 });
  readonly zoom = signal(6);
  readonly markers = signal<Marker[]>([]);

  ngOnInit(): void {
    // Ensure Google Maps is loaded before initializing
    this.googleMapsLoader.loadGoogleMaps().then(() => {
      this.calculateMapDimensions();
      this.hasMapError.set(false);
    }).catch((error) => {
      console.error('Failed to load Google Maps:', error);
      this.hasMapError.set(true);
      this.mapErrorMessage.set('Failed to load Google Maps. Please check your API key configuration.');
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.calculateMapDimensions();
  }

  private calculateMapDimensions(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calcul de la largeur responsive
    if (screenWidth <= 576) {
      // Mobile (xs)
      this.mapWidth.set('100%');
      this.mapHeight.set('400px');
    } else if (screenWidth <= 768) {
      // Tablet portrait (sm)
      this.mapWidth.set('100%');
      this.mapHeight.set('500px');
    } else if (screenWidth <= 992) {
      // Tablet landscape (md)
      this.mapWidth.set('100%');
      this.mapHeight.set('600px');
    } else if (screenWidth <= 1200) {
      // Desktop small (lg)
      this.mapWidth.set('95%');
      this.mapHeight.set('700px');
    } else {
      // Desktop large (xl)
      this.mapWidth.set('1100px');
      this.mapHeight.set('800px');
    }

    // Ajustement basé sur la hauteur de l'écran si nécessaire
    if (screenHeight < 700) {
      const currentHeightNum = parseInt(this.mapHeight().replace('px', ''));
      this.mapHeight.set(Math.min(currentHeightNum, screenHeight * 0.6) + 'px');
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.googleMapList && this.googleMapList.length > 0) {
      // Update markers
      this.markers.set(this.googleMapList.map(element => ({
        position: { lat: element.latitude, lng: element.longitude },
        name: element.pos_name,
        label: element.pos_name,
        category: element.postype,
        asm: element.asm || '',
        sup: element.sup || '',
        dr: element.dr || '',
        cyclo: element.cyclo || '',
        date: element.created_at,
        signature: element.signature,
      })));

      // Update map center to the first position if not already set to a specific location
      const currentCenter = this.center();
      if (currentCenter.lat === -4.4419 && currentCenter.lng === 15.2663) {
        this.center.set({ 
          lat: this.googleMapList[0].latitude, 
          lng: this.googleMapList[0].longitude 
        });
      }
    }
  }


  openInfoWindow(markerData: any, markerRef: MapMarker) {
    this.selectedMarker.set(markerData);

    if (this.infoWindow && typeof this.infoWindow.open === 'function') {
      this.infoWindow.open(markerRef);
    } else {
      console.error('ERROR: InfoWindow is not correctly initialized or .open() is not a function.');
    }
  }

  // NOUVELLE MÉTHODE pour fermer l'InfoWindow
  public closeInfoWindowManual(): void {
    if (this.infoWindow) {
      this.infoWindow.close();
    }
    this.selectedMarker.set(null); // Optionnel: désélectionner le marqueur
  }
}
