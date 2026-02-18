import { Component, OnInit, signal, inject } from '@angular/core';
import { routes } from '../../shared/routes/routes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';
import { IProvince } from '../../layout/territories/province/models/province.model';
import { ProvinceService } from '../../layout/territories/province/province.service';
import { IArea } from '../../layout/territories/areas/models/area.model'; 
import { IPos } from '../../layout/market/pos-vente/models/pos.model';
import { AreaService } from '../../layout/territories/areas/area.service';
import { SupService } from '../../layout/teams/sups/sup.service';
import { PosVenteService } from '../../layout/market/pos-vente/pos-vente.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  // Services avec inject()
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly provinceService = inject(ProvinceService);
  private readonly areaService = inject(AreaService);
  private readonly supService = inject(SupService);
  private readonly posService = inject(PosVenteService);
  private readonly toastr = inject(ToastrService);

  // Signals pour l'état du composant
  readonly dateY = formatDate(new Date(), 'yyyy', 'en');
  readonly routes = routes;
  readonly isLoading = signal(false);
  readonly password = signal<boolean[]>([false]);
  readonly isManager = signal(false);
  
  readonly provinceList = signal<IProvince[]>([]);
  readonly areaList = signal<IArea[]>([]);
  readonly areaListFilter = signal<IArea[]>([]);
  readonly posList = signal<IPos[]>([]);
  readonly posListFilter = signal<IPos[]>([]);

  formGroup!: FormGroup;

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      fullname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]], 
      phone: ['', Validators.required],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],  
    }); 
  }

  public togglePassword(index: number) {
    const current = this.password();
    current[index] = !current[index];
    this.password.set([...current]);
  }

  onSubmit() {
    try {
      if (this.formGroup.valid) {
        this.isLoading.set(true);
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
            this.isLoading.set(false);
            this.formGroup.reset();
            this.toastr.success('Compte cree avec succès! \n Contactez-votre adminstrateur', 'Success!');
            this.navigate();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            console.log(err);
          }
        });
      }
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }

  private navigate() {
    this.router.navigate([routes.login]);
  }
}
