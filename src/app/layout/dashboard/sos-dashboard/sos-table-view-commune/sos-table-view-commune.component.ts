import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { SOSTableViewModel } from '../../models/dashboard.models';
import { SosService } from '../../services/sos.service'; 
import { formatDate } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ISubArea } from '../../../territories/subarea/models/subarea.model';
import { SubareaService } from '../../../territories/subarea/subarea.service';

interface CommuneGroup {
  name: string;
  data: SOSTableViewModel[];
}

@Component({
  selector: 'app-sos-table-view-commune',
  standalone: false,
  templateUrl: './sos-table-view-commune.component.html',
  styleUrl: './sos-table-view-commune.component.scss'
})
export class SosTableViewCommuneComponent implements OnInit {
  isLoading = false;
  
    dateRange!: FormGroup;
    start_date!: string;
    end_date!: string;
  
    // Filtre 
    rangeDate: any[] = [];
  
    subarea!: ISubArea;
  
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
        subarea: new FormControl(''),
      });
      this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
      this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');
      
      this.route.params.subscribe(params => {
        const subarea_uuid = params['subarea_uuid']; 
        this.subareaService.getBy(subarea_uuid).subscribe((res) => {
          this.subarea = res.data;
          console.log('subarea:', this.subarea);
          this.getTableViewCommune(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
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
  
        this.getTableViewCommune(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
       
      });
    }
  
    getTableViewCommune(country_uuid: string, province_uuid: string, area_uuid: string, sub_area_uuid: string, start_date: string, end_date: string) {
      this.sosService.SOSTableViewCommune(country_uuid, province_uuid, area_uuid, sub_area_uuid, start_date, end_date).subscribe((res) => {
        this.tableViewList = res.data;
        this.isLoading = false;
      });
    }

  /**
   * Groupe les données par commune
   */
  getGroupedData(): CommuneGroup[] {
    const grouped = this.tableViewList.reduce((acc, item) => {
      const communeName = item.name;
      if (!acc[communeName]) {
        acc[communeName] = [];
      }
      acc[communeName].push(item);
      return acc;
    }, {} as { [key: string]: SOSTableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule le total des fardes pour une commune
   */
  getTotalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_farde, 0);
  }

  /**
   * Calcule le total global des fardes pour une commune
   */
  getTotalGlobalFarde(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_global_farde, 0);
  }

  /**
   * Calcule le total des POS pour une commune
   */
  getTotalPOS(data: SOSTableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.total_pos, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une commune
   */
  getMaxPercentage(data: SOSTableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.percentage));
  }

  /**
   * Compte le nombre de brands uniques pour une commune
   */
  getUniqueBrands(data: SOSTableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand_name));
    return uniqueBrands.size;
  }

}

