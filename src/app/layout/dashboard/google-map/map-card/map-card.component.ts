import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GoogleMapModel } from '../../models/summary-dashboard.model';
import { _isNumberValue } from '@angular/cdk/coercion';

interface Marker {
  lat: number;
  lng: number;
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
  Lat = 0;
  Lng = 0;

  ngOnChanges(changes: SimpleChanges): void {
    this.googleMapList.forEach(element => {
      this.markers.push({ lat: parseFloat(element.Latitude), lng: parseFloat(element.Longitude), name: element.Name });
    });

    console.log("markers", this.markers);
  }

}
