import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexXAxis,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { NDYearModel } from '../../models/dashboard.models';

export interface ChartOptions {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  dataLabels: ApexDataLabels | any;
  plotOptions: ApexPlotOptions | any;
  xaxis: ApexXAxis | any;
}
@Component({
  selector: 'app-oos-by-year',
  standalone: false,
  templateUrl: './oos-by-year.component.html',
  styleUrl: './oos-by-year.component.scss'
})
export class OosByYearComponent implements OnChanges {
  @Input() isLoading!: boolean; 
  @Input() ndYear: NDYearModel[] = [];

  ndYearList: NDYearModel[] = [];

  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions4: Partial<ChartOptions> | any;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ndYear'] && changes['ndYear'].currentValue) {
      this.ndYearList = changes['ndYear'].currentValue;
      console.log('ndYearList', this.ndYearList);
    }
    // this.ndYearList = this.ndYear;
    this.getChartByYear();
  }


  getChartByYear(): void {
    // Regrouper les données par mois
    const groupedData = this.ndYearList.reduce((acc, val) => {
      const monthIndex = parseInt(val.month, 10) - 1; // Convertir le mois en index (0-11)
      if (!acc[monthIndex]) {
        acc[monthIndex] = {}; // Initialiser un objet pour chaque mois
      }
      acc[monthIndex][val.brand_name] = (100 - val.percentage); // Associer le pourcentage à la marque pour le mois

    console.log('series', 100 - val.percentage);
      return acc;
    }, {} as { [month: number]: { [brand: string]: number } });

    // Construire les séries pour le graphique
    const brands = Array.from(new Set(this.ndYearList.map((val) => val.brand_name))); // Obtenir toutes les marques
    const series = brands.map((brand) => ({
      name: brand,
      data: Array(12).fill(0).map((_, monthIndex) => groupedData[monthIndex]?.[brand] || 0), // Remplir les données pour chaque mois
    }));


    this.chartOptions4 = {
      series: series,
      colors: this.ndYearList.map((item) => {
        if (item.brand_name === 'Equateur') {
          return '#FF0000'; // Rouge pour la marque "Equateur"
        }
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        return randomColor;
      }),
      chart: {
        height: 273,
        type: 'area',
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: true,
      },
      labels: [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Juin',
        'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      stroke: {
        curve: 'straight',
      },
      xaxis: {
        categories: [
          'Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Juin',
          'Juil', 'Aout', 'Sep', 'Oct', 'Nov', 'Dec'
        ],
      },
    };
  }
}

