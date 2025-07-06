import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProvinceService } from '../../../territories/province/province.service';
import { NdService } from '../../services/nd.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { IProvince } from '../../../territories/province/models/province.model';
import { TableViewModel } from '../../models/dashboard.models';

interface AreaGroup {
  name: string;
  data: TableViewModel[];
}

@Component({
  selector: 'app-oos-table-view-area',
  standalone: false,
  templateUrl: './oos-table-view-area.component.html',
  styleUrl: './oos-table-view-area.component.scss'
})
export class OosTableViewAreaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  province!: IProvince

  tableViewList: TableViewModel[] = [];

  constructor(
    private route: ActivatedRoute, 
    private _formBuilder: FormBuilder,
    private ndService: NdService,
    private provinceService: ProvinceService,
  ) { }


  ngOnInit(): void {
    this.isLoading = true;
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({ 
      rangeValue: new FormControl(this.rangeDate), 
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');
    
    this.route.params.subscribe(params => {
      const province_uuid = params['province_uuid'];
      console.log('Province UUID:', province_uuid);
      this.provinceService.getBy(province_uuid).subscribe((res) => {
        this.province = res.data;
        console.log('Province:', this.province);
        this.getTableArea(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
        this.isLoading = false;
      });
    });

    this.onChanges();
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      this.getTableArea(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
     
    }); 
  }


  getTableArea(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.ndService.NdTableViewArea(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      this.isLoading = false;
    });
  }

  /**
   * Groupe les données par area
   */
  getGroupedData(): AreaGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const areaName = item.name;
      if (!acc[areaName]) {
        acc[areaName] = [];
      }
      acc[areaName].push(item);
      return acc;
    }, {} as { [key: string]: TableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule la présence totale pour une area
   */
  getTotalPresence(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.presence, 0);
  }

  /**
   * Calcule le total des visites pour une area
   */
  getTotalVisits(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.visits, 0);
  }

  /**
   * Calcule le pourcentage de rupture total pour une area
   */
  getTotalOOSPercentage(data: TableViewModel[]): number {
    const totalVisits = this.getTotalVisits(data);
    const totalPresence = this.getTotalPresence(data);
    if (totalVisits === 0) return 0;
    return ((totalVisits - totalPresence) * 100 / totalVisits);
  }

  /**
   * Calcule la rupture de stock en chiffre pour une area
   */
  getTotalOOSNumber(data: TableViewModel[]): number {
    return this.getTotalVisits(data) - this.getTotalPresence(data);
  }

  /**
   * Compte le nombre de brands uniques pour une area
   */
  getUniqueBrands(data: TableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand));
    return uniqueBrands.size;
  }

  /**
   * Trouve le pourcentage de rupture maximum pour une area
   */
  getMaxOOSPercentage(data: TableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => 
      item.visits > 0 ? ((item.visits - item.presence) * 100 / item.visits) : 0
    ));
  }

}

