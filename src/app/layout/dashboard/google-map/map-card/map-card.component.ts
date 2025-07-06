import { Component, HostListener, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { _isNumberValue } from '@angular/cdk/coercion';
import { GoogleMapModel } from '../../models/dashboard.models';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../../../services/google-maps-loader.service';

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
  url?: string; // Optional URL for the marker
}


@Component({
  selector: 'app-map-card',
  standalone: false,
  templateUrl: './map-card.component.html',
  styleUrl: './map-card.component.scss'
})
export class MapCardComponent implements OnInit {
  @Input() isLoading!: boolean;
  @Input() googleMapList: GoogleMapModel[] = [];
  @ViewChild('infoWindow', { read: MapInfoWindow, static: false }) infoWindow!: MapInfoWindow;


  // Propriétés pour les dimensions dynamiques de la carte
  mapHeight = '800px';
  mapWidth = '1100px';
  hasMapError = false;
  mapErrorMessage = '';

  center: google.maps.LatLngLiteral = { lat: -4.350900786588518, lng: 15.32577513250754 };
  zoom = 12;
  markers: Marker[] = [];
  selectedMarker: Marker | null = null;

  constructor(private googleMapsLoader: GoogleMapsLoaderService) { }

  ngOnInit(): void {
    // Ensure Google Maps is loaded before initializing
    this.googleMapsLoader.loadGoogleMaps().then(() => {
      this.calculateMapDimensions();
      this.hasMapError = false;
    }).catch((error) => {
      console.error('Failed to load Google Maps:', error);
      this.hasMapError = true;
      this.mapErrorMessage = 'Failed to load Google Maps. Please check your API key configuration.';
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
      this.mapWidth = '100%';
      this.mapHeight = '400px';
    } else if (screenWidth <= 768) {
      // Tablet portrait (sm)
      this.mapWidth = '100%';
      this.mapHeight = '500px';
    } else if (screenWidth <= 992) {
      // Tablet landscape (md)
      this.mapWidth = '100%';
      this.mapHeight = '600px';
    } else if (screenWidth <= 1200) {
      // Desktop small (lg)
      this.mapWidth = '95%';
      this.mapHeight = '700px';
    } else {
      // Desktop large (xl)
      this.mapWidth = '1100px';
      this.mapHeight = '800px';
    }

    // Ajustement basé sur la hauteur de l'écran si nécessaire
    if (screenHeight < 700) {
      const currentHeightNum = parseInt(this.mapHeight.replace('px', ''));
      this.mapHeight = Math.min(currentHeightNum, screenHeight * 0.6) + 'px';
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (this.googleMapList && this.googleMapList.length > 0) {
      // Update markers
      this.markers = this.googleMapList.map(element => ({
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
        url: element.pos_uuid
      }));

      // Update map center to the first position if not already set to a specific location
      if (this.center.lat === -4.4419 && this.center.lng === 15.2663) {
        this.center = {
          lat: this.googleMapList[0].latitude,
          lng: this.googleMapList[0].longitude
        };
      }
    }
  }


  openInfoWindow(markerData: any, markerRef: MapMarker) {
    this.selectedMarker = markerData;

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
    this.selectedMarker = null; // Optionnel: désélectionner le marqueur
  }

}
