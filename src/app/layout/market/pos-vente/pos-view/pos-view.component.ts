import { ChangeDetectorRef, Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { routes } from '../../../../shared/routes/routes';
import { IPosForm } from '../../posform/models/posform.model';
import { IUser } from '../../../management/user/models/user.model';
import { IPos } from '../models/pos.model';
import { AuthService } from '../../../../auth/auth.service';
import { PosVenteService } from '../pos-vente.service'; 
import { LogsService } from '../../../management/user-logs/logs.service';


@Component({
  selector: 'app-pos-view',
  standalone: false,
  templateUrl: './pos-view.component.html',
  styleUrl: './pos-view.component.scss'
})
export class PosViewComponent implements OnInit {
  isLoadingData = false;
  public routes = routes;

  // Forms  
  idItem!: string;
  dataItem!: IPosForm; // Single data 

  formGroup!: FormGroup;
  currentUser!: IUser;
  isLoading = false;

  posUUID!: string;
  pos!: IPos; 
  activeTab: string = 'map-tab';
  
  posTypes: string[] = [
    'Gros',
    'Détail',
    'Mixte'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _formBuilder: FormBuilder,
    private authService: AuthService,
    private posService: PosVenteService,
    private logActivity: LogsService,
    private toastr: ToastrService
  ) {
  }


  ngOnInit() {
    this.isLoadingData = true;

    // Initialiser le formulaire de modification du POS
    this.formGroup = this._formBuilder.group({
      name: ['', Validators.required],
      shop: ['', Validators.required],
      postype: ['', Validators.required],
      gerant: ['', Validators.required],
      avenue: ['', Validators.required],
      quartier: ['', Validators.required],
      reference: ['', Validators.required],
      telephone: ['', Validators.required],
    });

    this.route.params.subscribe(params => {
      this.posUUID = params['uuid']; 
      this.posService.get(this.posUUID).subscribe(item => {
        this.authService.user().subscribe({
          next: (user) => {
            this.currentUser = user;
            this.pos = item.data; // Assign the fetched POS data to the pos property
            console.log("Pos view", this.pos);
            
            // Pré-remplir le formulaire avec les données du POS
            this.formGroup.patchValue({
              name: this.pos.name,
              shop: this.pos.shop,
              postype: this.pos.postype,
              gerant: this.pos.gerant,
              avenue: this.pos.avenue,
              quartier: this.pos.quartier,
              reference: this.pos.reference,
              telephone: this.pos.telephone,
            });
            this.isLoadingData = false;
          },
          error: (error) => {
            this.isLoadingData = false;
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
    this.activeTab = tabId;
    console.log('Tab clicked:', tabId); // Debug log
  }

  isTabActive(tabId: string): boolean {
    return this.activeTab === tabId;
  }

  onSubmitUpdate() {
    try {
      this.isLoading = true;
      var body: IPos = {
        name: this.formGroup.value.name,
        shop: this.formGroup.value.shop,
        postype: this.formGroup.value.postype,
        gerant: this.formGroup.value.gerant,
        avenue: this.formGroup.value.avenue,
        quartier: this.formGroup.value.quartier,
        reference: this.formGroup.value.reference,
        telephone: this.formGroup.value.telephone,
        country_uuid: this.currentUser.country_uuid,
        province_uuid: this.currentUser.province_uuid,
        area_uuid: this.currentUser.area_uuid,
        sub_area_uuid: this.currentUser.sub_area_uuid,
        commune_uuid: this.currentUser.commune_uuid,
        asm_uuid: this.currentUser.asm_uuid,
        asm: this.currentUser.asm,
        sup_uuid: this.currentUser.sup_uuid,
        sup: this.currentUser.sup,
        dr_uuid: this.currentUser.dr_uuid,
        dr: this.currentUser.dr,
        cyclo_uuid: this.currentUser.cyclo_uuid,
        cyclo: this.currentUser.cyclo,
        user_uuid: this.currentUser.uuid,
        status: this.pos.status, // Conserver le statut actuel
        signature: this.currentUser.fullname,
        sync: false // Indique que le POS n'est pas encore synchronisé
      };
      
      this.posService.update(this.posUUID, body)
        .subscribe({
          next: (res) => {
            this.logActivity.activity(
              'POS',
              this.currentUser.uuid,
              'updated',
              `Updated Pos uuid: ${res.data.uuid}`,
              this.currentUser.fullname
            ).subscribe({
              next: () => {
                this.formGroup.reset();
                this.toastr.success('Modification enregistré!', 'Success!');
                this.isLoading = false;
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
                this.isLoading = false;
                this.toastr.error(`${err.error.message}`, 'Oupss!');
                console.log(err);
              }
            });
          },
          error: err => {
            console.log(err);
            this.toastr.error('Une erreur s\'est produite!', 'Oupss!');
            this.isLoading = false;
          }
        });
    } catch (error) {
      this.isLoading = false;
      console.log(error);
    }
  }

  // Méthode pour recharger les données du POS après modification
  private loadPosData() {
    this.posService.get(this.posUUID).subscribe(item => {
      this.pos = item.data; 
      // Mettre à jour le formulaire avec les nouvelles données
      this.formGroup.patchValue({
        name: this.pos.name,
        shop: this.pos.shop,
        postype: this.pos.postype,
        gerant: this.pos.gerant,
        avenue: this.pos.avenue,
        quartier: this.pos.quartier,
        reference: this.pos.reference,
        telephone: this.pos.telephone,
      });
    });
  }

}

