import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../territories/province/models/province.model';
import { SOSTableViewModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { SosService } from '../../services/sos.service';
import { ProvinceService } from '../../../territories/province/province.service';
import { formatDate } from '@angular/common';

interface AreaGroup {
  name: string;
  data: SOSTableViewModel[];
}

@Component({
  selector: 'app-sos-table-view-area',
  standalone: false,
  templateUrl: './sos-table-view-area.component.html',
  styleUrl: './sos-table-view-area.component.scss'
})
export class SosTableViewAreaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  province!: IProvince

  tableViewList: SOSTableViewModel[] = [];

  constructor(
    private route: ActivatedRoute,
    private _formBuilder: FormBuilder,
    private sosService: SosService,
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
    this.sosService.SOSTableViewArea(country_uuid, province_uuid, start_date, end_date).subscribe((res) => {
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
    }, {} as { [key: string]: SOSTableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule la présence totale pour une area
   */
  getTotalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_farde, 0);
  }

  /**
   * Calcule le total global des fardes pour une area
   */
  getTotalGlobalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_global_farde, 0);
  }

  /**
   * Calcule le total des POS pour une area
   */
  getTotalPOS(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_pos, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une area
   */
  getMaxPercentage(data: SOSTableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.percentage));
  }

  /**
   * Compte le nombre de brands uniques pour une area
   */
  getUniqueBrands(data: SOSTableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand_name));
    return uniqueBrands.size;
  }

}
