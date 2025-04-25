import { Component, OnInit } from '@angular/core';
import { routes } from '../../shared/routes/routes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';
import { IProvince } from '../../layout/province/models/province.model';
import { IArea } from '../../layout/areas/models/area.model';
import { ISup } from '../../layout/sups/models/sup.model';
import { IPos } from '../../layout/pos-vente/models/pos.model';
import { ProvinceService } from '../../layout/province/province.service';
import { AreaService } from '../../layout/areas/area.service';
import { SupService } from '../../layout/sups/sup.service';
import { PosVenteService } from '../../layout/pos-vente/pos-vente.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  dateY = "";
  public routes = routes;
  isLoading = false;

  formGroup!: FormGroup;

  provinceList: IProvince[] = [];
  areaList: IArea[] = [];
  areaListFilter: IArea[] = [];
  supList: ISup[] = [];
  supListFilter: ISup[] = [];
  posList: IPos[] = [];
  posListFilter: IPos[] = [];

  isManager = false; 

  public password: boolean[] = [false];


  constructor(
    private router: Router,
    private formBuilder: FormBuilder, 
    private authService: AuthService,
    private provinceService: ProvinceService,
    private areaService: AreaService,
    private supService: SupService,
    private posService: PosVenteService,
    private toastr: ToastrService
  ) {
    this.dateY = formatDate(new Date(), 'yyyy', 'en');
  }

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      fullname: ['', Validators.required],
      email: ['', Validators.required], 
      phone: ['', Validators.required],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],  
    }); 
  }
 

  public togglePassword(index: number) {
    this.password[index] = !this.password[index]
  }

 

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading = true;
        var body = {
          fullname: this.formGroup.value.fullname,
          email: this.formGroup.value.email,
          title: 'DR',
          phone: this.formGroup.value.phone,
          password: this.formGroup.value.password,
          password_confirm: this.formGroup.value.password_confirm,
          province_uuid: 0,
          area_uuid: 0, 
          asm_uuid: 0, 
          pos_id: 0, 
          role: 'DR', // Role et title c'est la meme chose mais le role cest pour le code source
          permission: 'V',
          status: false,
          is_manager: false,
          signature: this.formGroup.value.fullname,
        };
        this.authService.register(body).subscribe({ 
          next: (res) => {
            this.isLoading = false;
            this.formGroup.reset();
            this.toastr.success('Compte cree avec succès! \n Contactez-votre adminstrateur', 'Success!');
            this.navigate();
          },
          error: (err) => {
            this.isLoading = false;
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  private navigate() {
    this.router.navigate([routes.login]);
  }
}
