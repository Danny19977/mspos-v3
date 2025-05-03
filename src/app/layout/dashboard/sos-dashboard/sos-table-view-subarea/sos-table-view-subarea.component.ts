import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IArea } from '../../../areas/models/area.model';
import { SOSTableViewModel } from '../../models/dashboard.models';
import { ActivatedRoute } from '@angular/router';
import { AreaService } from '../../../areas/area.service';
import { SosService } from '../../services/sos.service';
import { formatDate } from '@angular/common';

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
    private areaService: AreaService,
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
      this.areaService.getBy(areaName).subscribe((res) => {
        this.area = res.data;
        console.log('area:', this.area);
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

}

