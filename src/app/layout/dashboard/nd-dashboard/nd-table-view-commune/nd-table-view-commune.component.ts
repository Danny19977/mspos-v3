import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ISubArea } from '../../../subarea/models/subarea.model';
import { TableViewModel } from '../../models/nd-dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { NdService } from '../../services/nd.service';
import { SubareaService } from '../../../subarea/subarea.service';
import { formatDate } from '@angular/common';

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
      const areaName = params['area_name'];
      console.log('areaName Name:', areaName);
      this.subareaService.getBy(areaName).subscribe((res) => {
        this.subarea = res.data;
        console.log('subarea:', this.subarea);
        this.getTableViewCommune(this.subarea.country_uuid, this.subarea.province_uuid, this.subarea.area_uuid, this.subarea.uuid, this.start_date, this.end_date);
        this.isLoading = false;
      });
    });
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
    this.ndService.NdTableViewCommune(country_uuid, province_uuid, area_uuid, sub_area_uuid, start_date, end_date).subscribe((res) => {
      this.tableViewList = res.data;
      this.isLoading = false;
    });
  }
 
}

