import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { TableViewModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { NdService } from '../../services/nd.service';
import { formatDate } from '@angular/common';
import { ISubArea } from '../../../territories/subarea/models/subarea.model';
import { SubareaService } from '../../../territories/subarea/subarea.service';

interface CommuneGroup {
  name: string;
  data: TableViewModel[];
}

@Component({
  selector: 'app-nd-table-view-commune',
  standalone: false,
  templateUrl: './nd-table-view-commune.component.html',
  styleUrl: './nd-table-view-commune.component.scss'
})
export class NdTableViewCommuneComponent implements OnInit {
  isLoading = false;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  subarea!: ISubArea;

  tableViewList: TableViewModel[] = [];

  constructor(
    private route: ActivatedRoute, 
    private _formBuilder: FormBuilder,
    private ndService: NdService,
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

  getTableViewCommune(
    country_uuid: string, 
    province_uuid: string, 
    area_uuid: string, 
    sub_area_uuid: string, 
    start_date: string, 
    end_date: string) {
      console.log("getTableViewCommune", country_uuid, province_uuid, area_uuid, sub_area_uuid, start_date, end_date);
    this.ndService.NdTableViewCommune(country_uuid, province_uuid, area_uuid, sub_area_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      console.log('TableView Commune:', this.tableViewList);
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
    }, {} as { [key: string]: TableViewModel[] });

    return Object.keys(grouped).map(name => ({
      name,
      data: grouped[name]
    }));
  }

  /**
   * Calcule la présence totale pour une commune
   */
  getTotalPresence(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.presence, 0);
  }

  /**
   * Calcule le total des visites pour une commune
   */
  getTotalVisits(data: TableViewModel[]): number {
    return data.reduce((acc, item) => acc + item.visits, 0);
  }

  /**
   * Trouve le pourcentage maximum pour une commune
   */
  getMaxPercentage(data: TableViewModel[]): number {
    if (data.length === 0) return 0;
    return Math.max(...data.map(item => item.pourcent));
  }

  /**
   * Compte le nombre de brands uniques pour une commune
   */
  getUniqueBrands(data: TableViewModel[]): number {
    const uniqueBrands = new Set(data.map(item => item.brand));
    return uniqueBrands.size;
  }
 
}

