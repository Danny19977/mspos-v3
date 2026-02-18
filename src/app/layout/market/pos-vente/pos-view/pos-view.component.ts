import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../../../shared/routes/routes';
import { IPosForm } from '../../posform/models/posform.model';
import { IUser } from '../../../management/user/models/user.model';
import { IPos } from '../models/pos.model';
import { AuthService } from '../../../../auth/auth.service';
import { PosVenteService } from '../pos-vente.service';
import { LogsService } from '../../../management/user-logs/logs.service';
import { ReloadComponent } from '../../../../shared/components/reload/reload.component';
import { CollapseHeaderComponent } from '../../../../shared/common/collapse-header/collapse-header.component';
import { MapPosComponent } from './map-pos/map-pos.component';
import { PosformsComponent } from './posforms/posforms.component';
import { PosEquipmentComponent } from '../pos-equipment/pos-equipment.component';


@Component({
  selector: 'app-pos-view',
  standalone: true,
  imports: [
    // Core
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    // Material
    MatFormFieldModule,
    MatInputModule,
    // Custom Components
    ReloadComponent,
    CollapseHeaderComponent,
    MapPosComponent,
    PosformsComponent,
    PosEquipmentComponent
  ],
  templateUrl: './pos-view.component.html',
  styleUrl: './pos-view.component.scss'
})
export class PosViewComponent implements OnInit {
  // Force compiler to recognize component usage
  protected readonly _componentRefs = {
    reload: ReloadComponent,
    collapse: CollapseHeaderComponent,
    map: MapPosComponent,
    forms: PosformsComponent,
    equipment: PosEquipmentComponent
  };

  // Services avec inject()
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly posService = inject(PosVenteService);
  private readonly logActivity = inject(LogsService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals pour l'état du composant
  readonly isLoadingData = signal(false);
  readonly routes = routes;
  readonly idItem = signal('');
  readonly dataItem = signal<IPosForm | undefined>(undefined);
  readonly formGroup = signal<FormGroup>(new FormGroup({}));
  readonly currentUser = signal<IUser | undefined>(undefined);
  readonly isLoading = signal(false);
  readonly posUUID = signal('');
  readonly pos = signal<IPos | undefined>(undefined);
  readonly activeTab = signal('map-tab');
  readonly posTypes = signal<string[]>([
    'Gros',
    'Détail',
    'Mixte'
  ]);

  // Computed signal pour combiner les conditions
  readonly posData = computed(() => {
    const user = this.currentUser();
    const posValue = this.pos();
    return user && posValue ? posValue : undefined;
  });

  readonly canShowContent = computed(() => {
    return !this.isLoadingData() && this.posData() !== undefined;
  });


  ngOnInit() {
    this.isLoadingData.set(true);

    // Initialiser le formulaire de modification du POS
    this.formGroup.set(this.formBuilder.group({
      name: ['', Validators.required],
      shop: ['', Validators.required],
      postype: ['', Validators.required],
      gerant: ['', Validators.required],
      avenue: ['', Validators.required],
      quartier: ['', Validators.required],
      reference: ['', Validators.required],
      telephone: ['', Validators.required],
    }));

    this.route.params
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.posUUID.set(params['uuid']);
        this.posService.get(this.posUUID()).subscribe(item => {
          this.authService.user().subscribe({
            next: (user) => {
              this.currentUser.set(user);
              this.pos.set(item.data); // Assign the fetched POS data to the pos property 
              
              // Pré-remplir le formulaire avec les données du POS
              const currentPos = this.pos();
              if (currentPos) {
                this.formGroup().patchValue({
                  name: currentPos.name,
                  shop: currentPos.shop,
                  postype: currentPos.postype,
                  gerant: currentPos.gerant,
                  avenue: currentPos.avenue,
                  quartier: currentPos.quartier,
                  reference: currentPos.reference,
                  telephone: currentPos.telephone,
                });
              }
              this.isLoadingData.set(false);
            },
            error: (error) => {
              this.isLoadingData.set(false);
              this.router.navigate(['/auth/login']);
              console.log(error);
            }
          });
        });
      });
  }

  onTabClick(tabId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.activeTab.set(tabId);
    console.log('Tab clicked:', tabId); // Debug log
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab() === tabId;
  }

  onSubmitUpdate() {
    try {
      this.isLoading.set(true);
      const currentUser = this.currentUser();
      const currentPos = this.pos();
      const formValue = this.formGroup().value;
      
      if (!currentUser || !currentPos) {
        this.isLoading.set(false);
        this.toastr.error('Données utilisateur ou POS manquantes', 'Erreur');
        return;
      }

      var body: IPos = {
        name: formValue.name,
        shop: formValue.shop,
        postype: formValue.postype,
        gerant: formValue.gerant,
        avenue: formValue.avenue,
        quartier: formValue.quartier,
        reference: formValue.reference,
        telephone: formValue.telephone,
        country_uuid: currentUser.country_uuid,
        province_uuid: currentUser.province_uuid,
        area_uuid: currentUser.area_uuid,
        sub_area_uuid: currentUser.sub_area_uuid,
        commune_uuid: currentUser.commune_uuid,
        asm_uuid: currentUser.asm_uuid,
        asm: currentUser.asm,
        sup_uuid: currentUser.sup_uuid,
        sup: currentUser.sup,
        dr_uuid: currentUser.dr_uuid,
        dr: currentUser.dr,
        cyclo_uuid: currentUser.cyclo_uuid,
        cyclo: currentUser.cyclo,
        user_uuid: currentUser.uuid,
        status: currentPos.status, // Conserver le statut actuel
        signature: currentUser.fullname,
        sync: false // Indique que le POS n'est pas encore synchronisé
      };
      
      this.posService.update(this.posUUID(), body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'POS',
              currentUser.uuid,
              'updated',
              `Updated Pos uuid: ${res.data.uuid}`,
              currentUser.fullname
            ).subscribe({
              next: () => {
                this.formGroup().reset();
                this.toastr.success('Modification enregistré!', 'Success!');
                this.isLoading.set(false);
                // Fermer l'offcanvas automatiquement
                const offcanvasElement = document.getElementById('offcanvas_edit');
                if (offcanvasElement) {
                  const offcanvas = (window as any).bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
                  offcanvas.hide();
                }
                // Recharger les données du POS pour afficher les modifications
                this.loadPosData();
              },
              error: (err) => {
                this.isLoading.set(false);
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: err => {
            console.log(err);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            this.isLoading.set(false);
          }
        });
    } catch (error) {
      this.isLoading.set(false);
      console.log(error);
    }
  }

  // Méthode pour recharger les données du POS après modification
  private loadPosData() {
    this.posService.get(this.posUUID()).subscribe(item => {
      this.pos.set(item.data);
      // Mettre à jour le formulaire avec les nouvelles données
      const currentPos = this.pos();
      if (currentPos) {
        this.formGroup().patchValue({
          name: currentPos.name,
          shop: currentPos.shop,
          postype: currentPos.postype,
          gerant: currentPos.gerant,
          avenue: currentPos.avenue,
          quartier: currentPos.quartier,
          reference: currentPos.reference,
          telephone: currentPos.telephone,
        });
      }
    });
  }

}

