import { Component, Input, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { IPosEquipment } from '../models/pos-equipment.model';
import { PosEquipmentService } from './pos-equipment.service';
import { BrandService } from '../../brand/brand.service'; 
import { IBrand } from '../../brand/models/brand.model';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { IUser } from '../../../management/user/models/user.model';
import { AuthService } from '../../../../auth/auth.service';
import { SyncQueueService } from '../../../../shared/services/sync-queue.service';
import { DataSyncService } from '../../../../shared/services/data-sync.service';

declare var bootstrap: any;

@Component({
  selector: 'app-pos-equipment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './pos-equipment.component.html',
  styleUrl: './pos-equipment.component.scss'
})
export class PosEquipmentComponent implements OnInit {
  @Input() posUUId!: string;
  
  // Signal declarations
  equipmentList = signal<IPosEquipment[]>([]);
  isLoading = signal(false);
  total_pages = signal(0);
  page_size = signal(15);
  current_page = signal(1);
  total_records = signal(0);
  search = signal('');
  equipmentForm = signal<FormGroup>(null!);
  isEditMode = signal(false);
  selectedEquipment = signal<IPosEquipment | null>(null);
  equipmentToDelete = signal<IPosEquipment | null>(null);
  brandList = signal<IBrand[]>([]);
  currentUser = signal<IUser>(null!);

  // Services
  private equipmentService = inject(PosEquipmentService);
  private fb = inject(FormBuilder);
  private brandService = inject(BrandService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private destroyRef = inject(DestroyRef);
  private syncQueueService = inject(SyncQueueService);
  private dataSyncService = inject(DataSyncService);

  // Sync status signals
  isUploadSyncing = signal<boolean>(false);
  isDownloadSyncing = signal<boolean>(false);

  private searchSubject = new Subject<string>();

  ngOnInit() {
    this.syncQueueService.isSyncing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(syncing => this.isUploadSyncing.set(syncing));

    this.dataSyncService.syncProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(progress => this.isDownloadSyncing.set(!progress.isComplete && progress.total > 0));

    if (this.posUUId) {
      this.loadEquipments();
    }
    this.initializeForm();
    this.authService.user().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadBrandsByRole();
      }
    });
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((searchValue) => {
      if (searchValue.length === 0 || searchValue.length >= 3) {
        this.search.set(searchValue);
        this.current_page.set(1);
        this.loadEquipments();
      }
    });
  }

  private initializeForm() {
    this.equipmentForm.set(this.fb.group({
      parasol: ['', [Validators.required]],
      parasol_status: ['', [Validators.required]],
      stand: ['', [Validators.required]],
      stand_status: ['', [Validators.required]],
      kiosk: ['', [Validators.required]],
      kiosk_status: ['', [Validators.required]],
    }));
  }

  loadEquipments() {
    this.isLoading.set(true);
    this.equipmentService.getPaginatedById(this.posUUId, 
      this.current_page(), this.page_size(), this.search()).subscribe({
      next: (data) => {
        this.equipmentList.set(data.data || data);
        this.total_records.set(data.total || (data.meta ? data.meta.total : 0));
        this.total_pages.set(Math.ceil(this.total_records() / this.page_size()));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadBrandsByRole() {
    const currentUser = this.currentUser();
    if (!currentUser) return;
     this.brandService.getBrandsOfflineFirst(currentUser.province_uuid || undefined).subscribe({
        next: (res: any) => {
          const brands = res.data || [];
          // Ajouter l'option "Pas d'équipement" au début de la liste
          brands.unshift({
            uuid: 'no-equipment',
            name: "Pas d'équipement",
            country_uuid: '',
            province_uuid: '',
            signature: '',
            CreatedAt: new Date(),
            UpdatedAt: new Date()
          });
          this.brandList.set(brands);
        },
      });
  }

  addEquipment() {
    this.isEditMode.set(false);
    this.selectedEquipment.set(null);
    this.equipmentForm().reset();
    // Set default values for required fields
    this.equipmentForm().patchValue({
      parasol: '',
      parasol_status: '',
      stand: '',
      stand_status: '',
      kiosk: '',
      kiosk_status: ''
    });
    this.openModal('equipmentModal');
  }

  editEquipment(eq: IPosEquipment) {
    this.isEditMode.set(true);
    this.selectedEquipment.set(eq);
    this.equipmentForm().patchValue({
      parasol: eq.parasol || '',
      parasol_status: eq.parasol_status || '',
      stand: eq.stand || '',
      stand_status: eq.stand_status || '',
      kiosk: eq.kiosk || '',
      kiosk_status: eq.kiosk_status || ''
    });
    this.openModal('equipmentModal');
  }

  deleteEquipment(eq?: IPosEquipment) {
    if (eq) {
      this.equipmentToDelete.set(eq);
      this.openModal('deleteConfirmModal');
      return;
    }
    const toDelete = this.equipmentToDelete();
    if (!toDelete) return;
    this.isLoading.set(true);
    this.equipmentService.delete(toDelete.uuid!).subscribe({
      next: () => {
        this.loadEquipments();
        this.isLoading.set(false);
        this.closeModal('deleteConfirmModal');
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  confirmDelete() {
    this.deleteEquipment();
  }

  onSubmitEquipment() {
    if (this.equipmentForm().invalid) {
      // Mark all fields as touched to show validation errors
      this.equipmentForm().markAllAsTouched();
      this.toastr.warning('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    this.isLoading.set(true);
    const formValue = this.equipmentForm().value;
    const payload: IPosEquipment = {
      ...formValue,
      pos_uuid: this.posUUId,
    };
    
    const currentEquipment = this.selectedEquipment();
    if (this.isEditMode() && currentEquipment) {
      this.equipmentService.update(currentEquipment.uuid!, payload).subscribe({
        next: () => {
          this.loadEquipments();
          this.isLoading.set(false);
          this.closeModal('equipmentModal');
          this.toastr.success('Équipement modifié avec succès !');
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error updating equipment:', error);
          this.toastr.error('Erreur lors de la modification de l\'équipement.');
        }
      });
    } else {
      this.equipmentService.create(payload).subscribe({
        next: () => {
          this.loadEquipments();
          this.isLoading.set(false);
          this.closeModal('equipmentModal');
          this.toastr.success('Équipement ajouté avec succès !');
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Error creating equipment:', error);
          this.toastr.error('Erreur lors de l\'ajout de l\'équipement.');
        }
      });
    }
  }

  onSearch() {
    this.current_page.set(1);
    this.loadEquipments();
  }

  onTypeaheadSearch(value: string) {
    this.searchSubject.next(value);
  }

  changePage(page: number) {
    if (page < 1 || page > this.total_pages()) return;
    this.current_page.set(page);
    this.loadEquipments();
  }

  openModal(id: string) {
    try {
      const modalElement = document.getElementById(id);
      if (modalElement) {
        // S'assurer que le modal est attaché au body pour éviter les problèmes de z-index
        if (modalElement.parentNode !== document.body) {
          document.body.appendChild(modalElement);
        }
        
        const modal = new bootstrap.Modal(modalElement, {
          backdrop: 'static',
          keyboard: false
        });
        
        // Forcer le z-index après l'ouverture
        modalElement.style.zIndex = '10000';
        
        modal.show();
        
        // S'assurer que le backdrop a le bon z-index
        setTimeout(() => {
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {
            (backdrop as HTMLElement).style.zIndex = '9998';
          }
        }, 100);
      } else {
        console.error(`Modal element with id '${id}' not found`);
      }
    } catch (error) {
      console.error('Error opening modal:', error);
    }
  }

  closeModal(id: string) {
    try {
      const modalEl = document.getElementById(id);
      if (modalEl) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
          modal.hide();
        }
      }
    } catch (error) {
      console.error('Error closing modal:', error);
    }
  }
}
