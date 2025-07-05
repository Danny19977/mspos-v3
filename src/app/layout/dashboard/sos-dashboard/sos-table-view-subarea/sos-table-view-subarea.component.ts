import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SOSTableViewModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { SosService } from '../../services/sos.service';
import { formatDate } from '@angular/common';
import { IArea } from '../../../territories/areas/models/area.model';
import { AreaService } from '../../../territories/areas/area.service';
import { SubareaService } from '../../../territories/subarea/subarea.service';

interface SubareaGroup {
  name: string;
  data: SOSTableViewModel[];
}

@Component({
  selector: 'app-sos-table-view-subarea',
  standalone: false,
  templateUrl: './sos-table-view-subarea.component.html',
  styleUrl: './sos-table-view-subarea.component.scss'
})
export class SosTableViewSubareaComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  area!: IArea;

  tableViewList: SOSTableViewModel[] = [];

  constructor(
    private route: ActivatedRoute, 
    private _formBuilder: FormBuilder,
    private sosService: SosService,
    private subareaService: SubareaService,
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
      const areaName = params['area_name'];
      console.log('areaName Name:', areaName);
      this.subareaService.getBy(areaName).subscribe((res) => {
        this.area = res.data;
        console.log('subareaService:', this.area);
        this.getTableViewSubArea(this.area.country_uuid, this.area.province_uuid, this.area.uuid, this.start_date, this.end_date);
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

      this.getTableViewSubArea(this.area.country_uuid, this.area.province_uuid, this.area.uuid, this.start_date, this.end_date);
     
    });
  }



  getTableViewSubArea(country_uuid: string, province_uuid: string, area_uuid: string, start_date: string, end_date: string) {
    this.sosService.SOSTableViewSubArea(country_uuid, province_uuid, area_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      this.isLoading = false;
    });
  }

  /**
   * Groupe les données par subarea
   */
  getGroupedData(): SubareaGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const subareaName = item.name;
      if (!acc[subareaName]) {
        acc[subareaName] = [];
      }
      acc[subareaName].push(item);
      return acc;
    }, {} as { [key: string]: SOSTableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule le total des fardes pour une subarea
   */
  getTotalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_farde, 0);
  }

  /**
   * Calcule le total global des fardes pour une subarea
   */
  getTotalGlobalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_global_farde, 0);
  }

  /**
   * Calcule le total des POS pour une subarea
   */
  getTotalPOS(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_pos, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une subarea
   */
  getMaxPercentage(data: SOSTableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.percentage));
  }

  /**
   * Compte le nombre de brands uniques pour une subarea
   */
  getUniqueBrands(data: SOSTableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand_name));
    return uniqueBrands.size;
  }

}

