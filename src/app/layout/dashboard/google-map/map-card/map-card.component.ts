import { Component, Input, OnChanges, SimpleChanges } from '@angular/core'; 
import { _isNumberValue } from '@angular/cdk/coercion';
import { GoogleMapModel } from '../../models/dashboard.models';

interface Marker {
  position: google.maps.LatLngLiteral;
  name: string;
}

@Component({
  selector: 'app-map-card',
  standalone: false,
  templateUrl: './map-card.component.html',
  styleUrl: './map-card.component.scss'
})
export class MapCardComponent implements OnChanges {
  @Input() isLoading!: boolean;
  @Input() googleMapList: GoogleMapModel[] = [];

  center: google.maps.LatLngLiteral = { lat: -4.350900786588518, lng: 15.32577513250754 };
  zoom = 12;
  markers: Marker[] = [];
  selectedMarker: Marker | null = null;

  ngOnChanges(_changes: SimpleChanges): void {
    this.markers = this.googleMapList.map(element => ({
      position: { lat: element.latitude, lng: element.longitude },
      name: element.signature
    }));
  }

  openInfoWindow(marker: Marker): void {
    this.selectedMarker = marker;
    console.log(`Selected Marker: ${marker.name}`);
  }


  onMarkerClick(event: any) {
    
  }

}
