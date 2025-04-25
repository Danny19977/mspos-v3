import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SOSPieModel } from '../../models/summary-dashboard.model';

@Component({
  selector: 'app-map-area',
  standalone: false,
  templateUrl: './map-area.component.html',
  styleUrl: './map-area.component.scss'
})
export class MapAreaComponent implements OnChanges {

  @Input() isLoading: boolean = false;
  @Input() sosMapList: SOSPieModel[] = [];

  scaleKongoCentral = 0;
  scaleKinshasa = 0;
  scaleMaiNdombe = 0;
  scaleKwango = 0;
  scaleKwilu = 0;
  scaleKasai = 0;
  scaleKasaiCentral = 0;
  scaleKasaiOriental = 0;
  scaleLomami = 0;
  scaleLualaba = 0;
  scaleHautLomami = 0;
  scaleHautKatanga = 0;
  scaleTanganyka = 0;
  scaleSudKivu = 0;
  scaleManiema = 0;
  scaleNordKivu = 0;
  scaleIturi = 0;
  scaleHautUele = 0;
  scaleTshiopo = 0;
  scaleTshuapa = 0;
  scaleSunkuru = 0;
  scaleEquateur = 0;
  scaleMongala = 0;
  scaleNordUbungi = 0;
  scaleSudUbangi = 0;
  scaleBasUele = 0;

  ngOnChanges(changes: SimpleChanges): void { 
    for (let index = 0; index < this.sosMapList.length; index++) {
      const element = this.sosMapList[index];
      console.log("element", element);

      if (element.Province == 'Bas-Uele') {
        this.scaleBasUele = element.Eq; 
      } else if (element.Province == 'Equateur') {
        this.scaleEquateur = element.Eq;
      } else if (element.Province == 'Haut-Lomami') {
        this.scaleHautLomami = element.Eq;
      } else if (element.Province == 'Haut-Katanga') {
        this.scaleHautKatanga = element.Eq;
      } else if (element.Province == 'Haut-Uele') {
        this.scaleHautUele = element.Eq;
      } else if (element.Province == 'Ituri') {
        this.scaleIturi = element.Eq;
      } else if (element.Province == 'Kasaï') {
        this.scaleKasai = element.Eq;
      } else if (element.Province == 'Kasaï-Central') { 
        this.scaleKasaiCentral = element.Eq
      } else if (element.Province == 'Kasaï-Oriental') {
        this.scaleKasaiOriental = element.Eq;
      } else if (element.Province == 'Kinshasa') {
        this.scaleKinshasa = element.Eq;
      } else if (element.Province == 'Kongo-Central') {
        this.scaleKongoCentral = element.Eq;
      } else if (element.Province == 'Kwango') {
        this.scaleKwango = element.Eq;
      } else if (element.Province == 'Kwilu') {
        this.scaleKwilu = element.Eq;
      } else if (element.Province == 'Lualaba') {
        this.scaleLualaba = element.Eq;
      } else if (element.Province == 'Lomani') {
        this.scaleLomami = element.Eq;
      } else if (element.Province == 'Maniema') {
        this.scaleManiema = element.Eq;
      } else if (element.Province == 'Mai-Ndombe') {
        this.scaleMaiNdombe = element.Eq;
      } else if (element.Province == 'Mongala') {
        this.scaleMongala = element.Eq;
      } else if (element.Province == 'Nord-Kivu') {
        this.scaleNordKivu = element.Eq;
      } else if (element.Province == 'Nord-Ubangui') {
        this.scaleNordUbungi = element.Eq;
      } else if (element.Province == 'Sankuru') {
        this.scaleSunkuru = element.Eq;
      } else if (element.Province == 'Sud-Kivu') {
        this.scaleSudKivu = element.Eq;
      } else if (element.Province == 'Sud-Ubangui') {
        this.scaleSudUbangi = element.Eq;
      } else if (element.Province == 'Tanganyika') {
        this.scaleTanganyka = element.Eq;
      } else if (element.Province == 'Tshopo') {
        this.scaleTshiopo = element.Eq;
      } else if (element.Province == 'Tshuapa') {
        this.scaleTshuapa = element.Eq;
      }
    }
  } 

  toolTip(province: string, brand: number) {
    return `${province}: ${brand}%`;
  }
}
