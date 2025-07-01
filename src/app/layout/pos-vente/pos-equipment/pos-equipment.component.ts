import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPosEquipment } from '../models/pos-equipment.model';
import { PosEquipmentService } from './pos-equipment.service';
import { BrandService } from '../../brand/brand.service';
import { AuthService } from '../../../auth/auth.service';
import { IUser } from '../../user/models/user.model';
import { IBrand } from '../../brand/models/brand.model';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

declare var bootstrap: any;

@Component({
  selector: 'app-pos-equipment',
  standalone: false,
  templateUrl: './pos-equipment.component.html',
  styleUrl: './pos-equipment.component.scss'
})
export class PosEquipmentComponent implements OnInit {
  @Input() posUUId!: string;
  equipmentList: IPosEquipment[] = [];
  isLoading = false;

  total_pages: number = 0;
  page_size: number = 15;
  current_page: number = 1;
  total_records: number = 0;

  public search = '';

  equipmentForm!: FormGroup;
  isEditMode = false;
  selectedEquipment: IPosEquipment | null = null;
  equipmentToDelete: IPosEquipment | null = null;
  brandList: IBrand[] = [];
  currentUser!: IUser;

  private searchSubject = new Subject<string>();

  constructor(
    private equipmentService: PosEquipmentService,
    private fb: FormBuilder,
    private brandService: BrandService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    if (this.posUUId) {
      this.loadEquipments();
    }
    this.equipmentForm = this.fb.group({
      parasol: ['', Validators.required],
      parasol_status: ['', Validators.required],
      stand: ['', Validators.required],
      stand_status: ['', Validators.required],
      kiosk: ['', Validators.required],
      kiosk_status: ['', Validators.required],
    });
    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadBrandsByRole();
      }
    });
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((searchValue) => {
      if (searchValue.length === 0 || searchValue.length >= 3) {
        this.search = searchValue;
        this.current_page = 1;
        this.loadEquipments();
      }
    });
  }

  loadEquipments() {
    this.isLoading = true;
    this.equipmentService.getPaginatedById(this.posUUId, 
      this.current_page, this.page_size, this.search).subscribe({
      next: (data) => {
        this.equipmentList = data.data || data;
        this.total_records = data.total || (data.meta ? data.meta.total : 0);
        this.total_pages = Math.ceil(this.total_records / this.page_size);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadBrandsByRole() {
    if (!this.currentUser) return;
     this.brandService.getAllByASM(this.currentUser.province_uuid).subscribe({
        next: (res: any) => {
          this.brandList = res.data || [];
          // Ajouter l'option "Pas d'équipement" au début de la liste
          this.brandList.unshift({
            uuid: 'no-equipment',
            name: "Pas d'équipement",
            country_uuid: '',
            province_uuid: '',
            signature: '',
            CreatedAt: new Date(),
            UpdatedAt: new Date()
          });
        },
      });
  }

  addEquipment() {
    this.isEditMode = false;
    this.selectedEquipment = null;
    this.equipmentForm.reset();
    this.openModal('equipmentModal');
  }

  editEquipment(eq: IPosEquipment) {
    this.isEditMode = true;
    this.selectedEquipment = eq;
    this.equipmentForm.patchValue(eq);
    this.openModal('equipmentModal');
  }

  deleteEquipment(eq?: IPosEquipment) {
    if (eq) {
      this.equipmentToDelete = eq;
      this.openModal('deleteConfirmModal');
      return;
    }
    if (!this.equipmentToDelete) return;
    this.isLoading = true;
    this.equipmentService.delete(this.equipmentToDelete.uuid!).subscribe({
      next: () => {
        this.loadEquipments();
        this.isLoading = false;
        this.closeModal('deleteConfirmModal');
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  confirmDelete() {
    this.deleteEquipment();
  }

  onSubmitEquipment() {
    if (this.equipmentForm.invalid) return;
    this.isLoading = true;
    const formValue = this.equipmentForm.value;
    const payload: IPosEquipment = {
      ...formValue,
      pos_uuid: this.posUUId,
    };
    if (this.isEditMode && this.selectedEquipment) {
      this.equipmentService.update(this.selectedEquipment.uuid!, payload).subscribe({
        next: () => {
          this.loadEquipments();
          this.isLoading = false;
          this.closeModal('equipmentModal');
          this.toastr.success('Équipement modifié avec succès !');
        },
        error: () => {
          this.isLoading = false;
          this.toastr.error('Erreur lors de la modification de l\'équipement.');
        }
      });
    } else {
      this.equipmentService.create(payload).subscribe({
        next: () => {
          this.loadEquipments();
          this.isLoading = false;
          this.closeModal('equipmentModal');
          this.toastr.success('Équipement ajouté avec succès !');
        },
        error: () => {
          this.isLoading = false;
          this.toastr.error('Erreur lors de l\'ajout de l\'équipement.');
        }
      });
    }
  }

  onSearch() {
    this.current_page = 1;
    this.loadEquipments();
  }

  onTypeaheadSearch(value: string) {
    this.searchSubject.next(value);
  }

  changePage(page: number) {
    if (page < 1 || page > this.total_pages) return;
    this.current_page = page;
    this.loadEquipments();
  }

  openModal(id: string) {
    const modal = new bootstrap.Modal(document.getElementById(id));
    modal.show();
  }

  closeModal(id: string) {
    const modalEl = document.getElementById(id);
    if (modalEl) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
  }
}
