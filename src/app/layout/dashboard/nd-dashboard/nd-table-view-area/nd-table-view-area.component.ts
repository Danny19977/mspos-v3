import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProvinceService } from '../../../province/province.service';
import { NdService } from '../../services/nd.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { IProvince } from '../../../province/models/province.model';
import { TableViewModel } from '../../models/nd-dashboard.models';

@Component({
  selector: 'app-nd-table-view-area',
  standalone: false,
  templateUrl: './nd-table-view-area.component.html',
  styleUrl: './nd-table-view-area.component.scss'
})
export class NdTableViewAreaComponent implements OnInit {
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
      area: new FormControl(''),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');
    
    this.route.params.subscribe(params => {
      const provinceName = params['province_name'];
      console.log('Province Name:', provinceName);
      this.provinceService.getBy(provinceName).subscribe((res) => {
        this.province = res.data;
        console.log('Province:', this.province);
        this.getTableArea(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
        this.isLoading = false;
      });
    });
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

}
