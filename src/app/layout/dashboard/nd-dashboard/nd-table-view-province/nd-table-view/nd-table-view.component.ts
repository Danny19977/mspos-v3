import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { TableViewModel } from '../../../models/dashboard.models';
import { IProvince } from '../../../../territories/province/models/province.model';

interface ProvinceGroup {
  name: string;
  data: TableViewModel[];
}

@Component({
  selector: 'app-nd-table-view',
  standalone: false,
  templateUrl: './nd-table-view.component.html',
  styleUrl: './nd-table-view.component.scss'
})
export class NdTableViewComponent implements OnChanges {
  
  @Input() tableView: TableViewModel[] = [];
  @Input() isLoading!: boolean;

  tableViewList: TableViewModel[] = [];

  provinceList: IProvince[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.tableViewList = this.tableView;
  }

  /**
   * Groupe les données par province
   */
  getGroupedData(): ProvinceGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const provinceName = item.name;
      if (!acc[provinceName]) {
        acc[provinceName] = [];
      }
      acc[provinceName].push(item);
      return acc;
    }, {} as { [key: string]: TableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule le pourcentage moyen pour une province
   */
  getAveragePercentage(data: TableViewModel[]): string {
    if (data.length === 0) return '0';
    const sum = data.reduce((acc, item) => acc + item.pourcent, 0);
    return (sum / data.length).toFixed(1);
  }

  /**
   * Calcule la présence totale pour une province
   */
  getTotalPresence(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.presence, 0);
  }

  /**
   * Calcule le total des visites pour une province
   */
  getTotalVisits(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.visits, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une province
   */
  getMaxPercentage(data: TableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.pourcent));
  }

  /**
   * Compte le nombre de brands uniques pour une province
   */
  getUniqueBrands(data: TableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand));
    return uniqueBrands.size;
  }

  /**
   * Affiche les détails d'un élément
   */
  showDetails(item: TableViewModel): void {
    // Vous pouvez implémenter ici l'ouverture d'un modal ou la navigation vers une page de détails
    console.log('Détails de:', item);
    // Exemple: this.router.navigate(['/details', item.name]);
    // Ou ouvrir un modal avec les détails
  }
}
