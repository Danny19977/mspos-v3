import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { IUser } from '../../../management/user/models/user.model';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { IProvince } from '../../../territories/province/models/province.model';
import { KPITableViewPriceModel } from '../../models/dashboard.models';
import { ProvinceService } from '../../../territories/province/province.service';
import { AuthService } from '../../../../auth/auth.service';
import { KpiService } from '../../services/kpi.service';
import { formatDate } from '@angular/common';
import { ICountry } from '../../../territories/country/models/country.model';
import { CountryService } from '../../../territories/country/country.service';
import { Router } from '@angular/router';

// Interface pour les données groupées hiérarchiquement
interface GroupedData {
  title: string;
  signature: string;
  level: number; // 0: ASM, 1: Supervisor, 2: DR, 3: Cyclo
  total_visits: number;
  objectif: number;
  target: number;
  achievement_percentage: number;
  count: number;
  isExpanded: boolean;
  children?: GroupedData[];
  originalData?: KPITableViewPriceModel;
  groupKey?: string;
  hierarchyType?: string;
  personalVisits?: number; // Visites de cette personne uniquement
  teamVisits?: number; // Visites de son équipe
}


@Component({
  selector: 'app-kpi-table-view-province',
  standalone: false,
  templateUrl: './kpi-table-view-province.component.html',
  styleUrl: './kpi-table-view-province.component.scss'
})
export class KpiTableViewProvinceComponent implements OnInit, OnDestroy {
  isLoading = false;
  currentUser!: IUser;

  dateRange!: FormGroup;
  start_date!: string;
  end_date!: string;

  // Filtre 
  rangeDate: any[] = [];

  // Propriétés pour le rafraîchissement automatique
  autoRefreshInterval?: any;

  provinceList: IProvince[] = [];
  province!: IProvince;

  tableViewList: KPITableViewPriceModel[] = [];


  countrySearch = signal<string>('');
  countryList = signal<ICountry[]>([]);
  filteredCountryList = computed(() =>
    this.countryList().filter((country) =>
      country.name.toLowerCase().includes(this.countrySearch().toLowerCase())
    )
  );

  // Données hiérarchiques
  groupedData: GroupedData[] = [];
  isHierarchicalView = true;

  // Propriétés de recherche
  searchTerm: string = '';
  filteredTableViewList: KPITableViewPriceModel[] = [];
  filteredGroupedData: GroupedData[] = [];

  // Hiérarchie des titres (du plus haut au plus bas)
  readonly titleHierarchy = ['ASM', 'Supervisor', 'DR', 'Cyclo'];

  // Mapping des niveaux hiérarchiques
  readonly levelMapping: { [key: string]: number } = {
    'ASM': 0,
    'Supervisor': 1,
    'DR': 2,
    'Cyclo': 3
  };

  constructor(
    private router: Router,
    private _formBuilder: FormBuilder,
    private countryService: CountryService,
    private provinceService: ProvinceService,
    private authService: AuthService,
    private kpiService: KpiService,
  ) {
  }


  ngOnInit(): void {
    this.isLoading = true;

    // Initialisation explicite des tableaux pour éviter les erreurs null
    this.tableViewList = [];
    this.groupedData = [];
    this.filteredTableViewList = [];
    this.filteredGroupedData = [];
    this.provinceList = [];
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.rangeDate = [firstDay, lastDay];

    this.dateRange = this._formBuilder.group({
      country: new FormControl(''),
      rangeValue: new FormControl(this.rangeDate),
    });
    this.start_date = formatDate(this.dateRange.value.rangeValue[0], 'yyyy-MM-dd', 'en-US');
    this.end_date = formatDate(this.dateRange.value.rangeValue[1], 'yyyy-MM-dd', 'en-US');


    this.authService.user().subscribe({
      next: (user) => {
        this.currentUser = user;

        this.countryService.getAll().subscribe((res) => {
          this.countryList.set(res.data);
          this.provinceService.getAll().subscribe((pr) => {
            this.provinceList = pr.data;
            if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
              this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);

            } else {
              this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);

            }
          });
        });

      },
      error: (error) => {
        console.log(error);
      }
    });

    this.onChanges();

    // Démarrer la synchronisation automatique toutes les 30 secondes
    // this.startAutoRefresh();
  }


  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement; // Cast explicite
    this.countrySearch.set(input.value); // Met à jour le signal avec la valeur de l'input
  }

  onCheckboxCountryChange(event: any, item: ICountry) {
    if (event.target.checked) {
      console.log('item:', item);
      this.getTableView(item.uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
    }
  }


  onChanges(): void {
    this.dateRange.valueChanges.subscribe((val) => {
      this.start_date = formatDate(val.rangeValue[0], 'yyyy-MM-dd', 'en-US');

      val.rangeValue[1].setDate(val.rangeValue[1].getDate() + 1);
      this.end_date = formatDate(val.rangeValue[1], 'yyyy-MM-dd', 'en-US');

      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') {
        this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
      } else {
        this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      }
    });
  }


  onProvinceChange(event: any) {
    this.isLoading = true;
    this.province = event.value;
    console.log('province:', this.province);
    this.getTableView(this.province.country_uuid, this.province.uuid, this.start_date, this.end_date);
  }


  getTableView(country_uuid: string, province_uuid: string, start_date: string, end_date: string) {
    this.kpiService.TableViewProvince(country_uuid, province_uuid, start_date, end_date).subscribe({
      next: (res) => {
        // Vérification de sécurité pour la réponse
        this.tableViewList = res?.data || [];
        console.log("tableViewList", this.tableViewList);

        // Organiser les données selon la hiérarchie géographique
        this.groupedData = this.organizeHierarchicalData(this.tableViewList);
        console.log("groupedData", this.groupedData);
        
        // Initialiser les données filtrées
        this.filteredTableViewList = [...this.tableViewList];
        this.filteredGroupedData = [...this.groupedData];
        
        // Appliquer la recherche si un terme est présent
        if (this.searchTerm.trim() !== '') {
          this.onSearch();
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des données KPI:', error);
        this.tableViewList = [];
        this.groupedData = [];
        this.filteredTableViewList = [];
        this.filteredGroupedData = [];
        this.isLoading = false;
      }
    });
  }


   // Organiser les données selon la hiérarchie ASM → Supervisor → DR → Cyclo
    private organizeHierarchicalData(data: KPITableViewPriceModel[]): GroupedData[] {
      console.log('Données reçues pour organisation hiérarchique:', data);
      
      // Vérification de sécurité pour éviter l'erreur "Cannot read properties of null"
      if (!data || !Array.isArray(data)) {
        console.warn('Données invalides reçues:', data);
        return [];
      }
      
      // 1. Séparer les données par titre
      const asmData = data.filter(item => item && item.title === 'ASM');
      const supervisorData = data.filter(item => item && item.title === 'Supervisor');
      const drData = data.filter(item => item && item.title === 'DR');
      const cycloData = data.filter(item => item && item.title === 'Cyclo');
      
      console.log(`Données trouvées - ASM: ${asmData.length}, Supervisor: ${supervisorData.length}, DR: ${drData.length}, Cyclo: ${cycloData.length}`);
      
      const result: GroupedData[] = [];
      
      // 2. Si nous avons des ASM, créer la hiérarchie complète
      if (asmData.length > 0) {
        asmData.forEach((asm, asmIndex) => {
          const asmGroup: GroupedData = {
            title: `${asm.title}: ${asm.signature}`,
            signature: asm.signature,
            level: 0,
            total_visits: asm.total_visits,
            objectif: asm.objectif,
            target: asm.target,
            achievement_percentage: this.calculateSafePercentage(asm.total_visits, asm.target),
            count: 1,
            isExpanded: true,
            children: [],
            originalData: asm,
            groupKey: `asm-${asm.signature}`,
            hierarchyType: 'ASM',
            personalVisits: asm.total_visits,
            teamVisits: 0
          };
          
          // 3. Distribuer les supervisors équitablement parmi les ASM
          const supervisorsPerAsm = Math.ceil(supervisorData.length / asmData.length);
          const startIndex = asmIndex * supervisorsPerAsm;
          const endIndex = Math.min(startIndex + supervisorsPerAsm, supervisorData.length);
          const assignedSupervisors = supervisorData.slice(startIndex, endIndex);
          
          let asmTotalTeamVisits = 0;
          let asmTotalTeamObjectif = 0;
          let asmTotalTeamTarget = 0;
          
          assignedSupervisors.forEach((supervisor, supIndex) => {
            const supervisorGroup: GroupedData = {
              title: `${supervisor.title}: ${supervisor.signature}`,
              signature: supervisor.signature,
              level: 1,
              total_visits: supervisor.total_visits,
              objectif: supervisor.objectif,
              target: supervisor.target,
              achievement_percentage: this.calculateSafePercentage(supervisor.total_visits, supervisor.target),
              count: 1,
              isExpanded: false,
              children: [],
              originalData: supervisor,
              groupKey: `supervisor-${supervisor.signature}`,
              hierarchyType: 'Supervisor',
              personalVisits: supervisor.total_visits,
              teamVisits: 0
            };
            
            // 4. Distribuer les DRs parmi les supervisors
            const drsPerSupervisor = Math.ceil(drData.length / supervisorData.length);
            const drStartIndex = (startIndex + supIndex) * drsPerSupervisor;
            const drEndIndex = Math.min(drStartIndex + drsPerSupervisor, drData.length);
            const assignedDrs = drData.slice(drStartIndex, drEndIndex);
            
            let supervisorTotalTeamVisits = 0;
            let supervisorTotalTeamObjectif = 0;
            let supervisorTotalTeamTarget = 0;
            
            assignedDrs.forEach((dr, drIndex) => {
              const drGroup: GroupedData = {
                title: `${dr.title}: ${dr.signature}`,
                signature: dr.signature,
                level: 2,
                total_visits: dr.total_visits,
                objectif: dr.objectif,
                target: dr.target,
                achievement_percentage: this.calculateSafePercentage(dr.total_visits, dr.target),
                count: 1,
                isExpanded: false,
                children: [],
                originalData: dr,
                groupKey: `dr-${dr.signature}`,
                hierarchyType: 'DR',
                personalVisits: dr.total_visits,
                teamVisits: 0
              };
              
              // 5. Distribuer les Cyclos parmi les DRs
              const cyclosPerDr = Math.ceil(cycloData.length / drData.length);
              const cycloStartIndex = (drStartIndex + drIndex) * cyclosPerDr;
              const cycloEndIndex = Math.min(cycloStartIndex + cyclosPerDr, cycloData.length);
              const assignedCyclos = cycloData.slice(cycloStartIndex, cycloEndIndex);
              
              let drTotalTeamVisits = 0;
              let drTotalTeamObjectif = 0;
              let drTotalTeamTarget = 0;
              
              assignedCyclos.forEach(cyclo => {
                const cycloGroup: GroupedData = {
                  title: `${cyclo.title}: ${cyclo.signature}`,
                  signature: cyclo.signature,
                  level: 3,
                  total_visits: cyclo.total_visits,
                  objectif: cyclo.objectif,
                  target: cyclo.target,
                  achievement_percentage: this.calculateSafePercentage(cyclo.total_visits, cyclo.target),
                  count: 1,
                  isExpanded: false,
                  children: [],
                  originalData: cyclo,
                  groupKey: `cyclo-${cyclo.signature}`,
                  hierarchyType: 'Cyclo',
                  personalVisits: cyclo.total_visits,
                  teamVisits: 0
                };
                
                drGroup.children!.push(cycloGroup);
                drTotalTeamVisits += cyclo.total_visits;
                drTotalTeamObjectif += cyclo.objectif;
                drTotalTeamTarget += cyclo.target;
              });
              
              // Mettre à jour les totaux du DR
              drGroup.teamVisits = drTotalTeamVisits;
              drGroup.total_visits += drTotalTeamVisits;
              drGroup.objectif += drTotalTeamObjectif;
              drGroup.target += drTotalTeamTarget;
              drGroup.achievement_percentage = this.calculateSafePercentage(drGroup.total_visits, drGroup.target);
              drGroup.count += assignedCyclos.length;
              
              supervisorGroup.children!.push(drGroup);
              supervisorTotalTeamVisits += drGroup.total_visits - dr.total_visits; // Seulement l'équipe du DR
              supervisorTotalTeamObjectif += drTotalTeamObjectif;
              supervisorTotalTeamTarget += drTotalTeamTarget;
            });
            
            // Mettre à jour les totaux du Supervisor
            supervisorGroup.teamVisits = supervisorTotalTeamVisits;
            supervisorGroup.total_visits += supervisorTotalTeamVisits;
            supervisorGroup.objectif += supervisorTotalTeamObjectif;
            supervisorGroup.target += supervisorTotalTeamTarget;
            supervisorGroup.achievement_percentage = this.calculateSafePercentage(supervisorGroup.total_visits, supervisorGroup.target);
            supervisorGroup.count += assignedDrs.length + assignedDrs.reduce((sum, dr, drIndex) => {
              const cyclosPerDr = Math.ceil(cycloData.length / drData.length);
              const cycloStartIndex = (drStartIndex + drIndex) * cyclosPerDr;
              const cycloEndIndex = Math.min(cycloStartIndex + cyclosPerDr, cycloData.length);
              return sum + (cycloEndIndex - cycloStartIndex);
            }, 0);
            
            asmGroup.children!.push(supervisorGroup);
            asmTotalTeamVisits += supervisorGroup.total_visits - supervisor.total_visits; // Seulement l'équipe du Supervisor
            asmTotalTeamObjectif += supervisorTotalTeamObjectif;
            asmTotalTeamTarget += supervisorTotalTeamTarget;
          });
          
          // Mettre à jour les totaux de l'ASM
          asmGroup.teamVisits = asmTotalTeamVisits;
          asmGroup.total_visits += asmTotalTeamVisits;
          asmGroup.objectif += asmTotalTeamObjectif;
          asmGroup.target += asmTotalTeamTarget;
          asmGroup.achievement_percentage = this.calculateSafePercentage(asmGroup.total_visits, asmGroup.target);
          asmGroup.count += assignedSupervisors.length + assignedSupervisors.reduce((sum, sup, supIndex) => {
            const drsPerSupervisor = Math.ceil(drData.length / supervisorData.length);
            const drStartIndex = (startIndex + supIndex) * drsPerSupervisor;
            const drEndIndex = Math.min(drStartIndex + drsPerSupervisor, drData.length);
            return sum + (drEndIndex - drStartIndex);
          }, 0) + cycloData.length;
          
          result.push(asmGroup);
        });
      } else {
        // 6. Fallback : créer une structure simplifiée par titre si pas d'ASM
        const allTitles = ['Supervisor', 'DR', 'Cyclo'];
        allTitles.forEach(title => {
          const titleData = data.filter(item => item && item.title === title);
          if (titleData.length > 0) {
            const titleGroup: GroupedData = {
              title: `Équipe ${title}`,
              signature: `Équipe ${title}`,
              level: this.levelMapping[title] ?? 3,
              total_visits: titleData.reduce((sum, item) => sum + item.total_visits, 0),
              objectif: titleData.reduce((sum, item) => sum + item.objectif, 0),
              target: titleData.reduce((sum, item) => sum + item.target, 0),
              achievement_percentage: 0,
              count: titleData.length,
              isExpanded: true,
              children: [],
              groupKey: `group-${title}`,
              hierarchyType: title,
              personalVisits: 0,
              teamVisits: titleData.reduce((sum, item) => sum + item.total_visits, 0)
            };
            
            titleGroup.achievement_percentage = this.calculateSafePercentage(titleGroup.total_visits, titleGroup.target);
            
            titleData.forEach(item => {
              const itemGroup: GroupedData = {
                title: `${item.title}: ${item.signature}`,
                signature: item.signature,
                level: (this.levelMapping[item.title] ?? 3) + 1,
                total_visits: item.total_visits,
                objectif: item.objectif,
                target: item.target,
                achievement_percentage: this.calculateSafePercentage(item.total_visits, item.target),
                count: 1,
                isExpanded: false,
                children: [],
                originalData: item,
                groupKey: `${item.title}-${item.signature}`,
                hierarchyType: item.title,
                personalVisits: item.total_visits,
                teamVisits: 0
              };
              titleGroup.children!.push(itemGroup);
            });
            
            result.push(titleGroup);
          }
        });
      }
      
      console.log('Hiérarchie organisée:', result);
      return result;
    }
  
    private calculateSafePercentage(actual: number, target: number): number {
      if (!target || target === 0) return 0;
      return Math.round((actual / target) * 100);
    }
  
    // Basculer entre vue hiérarchique et normale
    toggleHierarchicalView(): void {
      this.isHierarchicalView = !this.isHierarchicalView;
    }
  
    // Développer/réduire un groupe
    toggleExpansion(group: GroupedData): void {
      group.isExpanded = !group.isExpanded;
    }
  
    // Développer tous les groupes
    expandAll(): void {
      this.expandCollapseAll(this.groupedData, true);
    }
  
    // Réduire tous les groupes
    collapseAll(): void {
      this.expandCollapseAll(this.groupedData, false);
    }
  
    private expandCollapseAll(groups: GroupedData[], expanded: boolean): void {
      groups.forEach(group => {
        group.isExpanded = expanded;
        if (group.children) {
          this.expandCollapseAll(group.children, expanded);
        }
      });
    }
  
    // Obtenir la classe CSS pour le niveau hiérarchique
    getBadgeClass(level: number): string {
      const classes = ['badge-primary', 'badge-success', 'badge-warning', 'badge-secondary'];
      return classes[level] || 'badge-secondary';
    }
  
    // Obtenir le label du niveau hiérarchique
    getLevelLabel(level: number): string {
      const labels = ['ASM', 'Supervisor', 'DR', 'Cyclo'];
      return labels[level] || 'Agent';
    }
  
    // Obtenir la classe CSS pour les badges de performance
    getPerformanceBadgeClass(percentage: number): string {
      if (percentage >= 100) return 'bg-success';
      if (percentage >= 80) return 'bg-warning';
      return 'bg-danger';
    }
  
    // Obtenir la classe CSS pour les badges de titre
    getTitleBadgeClass(title: string): string {
      const titleClasses: { [key: string]: string } = {
        'ASM': 'bg-primary',
        'Supervisor': 'bg-success',
        'DR': 'bg-warning',
        'Cyclo': 'bg-secondary'
      };
      return titleClasses[title] || 'bg-info';
    }
  
    // Calculer la performance d'un item
    getItemPerformance(item: KPITableViewPriceModel): number {
      return item.objectif > 0 ? (item.total_visits / item.objectif) * 100 : 0;
    }
  
    // Voir les détails d'un groupe
    viewDetails(group: GroupedData): void {
      console.log('Détails du groupe:', group);
      // Implémenter la navigation vers les détails
      // <a [routerLink]="['/web/posforms/pos-form-filter', 'province', element.uuid]"> 

      if( group.originalData?.title === 'ASM') {
        this.router.navigate(['/web/posforms/pos-form-filter', 'ASM', group.originalData?.province_uuid]);
      } else if (group.originalData?.title === 'Supervisor') {
        this.router.navigate(['/web/posforms/pos-form-filter', 'Supervisor', group.originalData?.area_uuid]);
      } else if (group.originalData?.title === 'DR') {
        this.router.navigate(['/web/posforms/pos-form-filter', 'DR', group.originalData?.sub_area_uuid]);
      } else if (group.originalData?.title === 'Cyclo') {
        this.router.navigate(['/web/posforms/pos-form-filter', 'Cyclo', group.originalData?.commune_uuid]);
      } else {
        this.router.navigate(['/web/dashboard/key-performance-indicators']);
      }
    }
  
    // Statistiques pour les cartes de résumé
    getTotalAgents(): number {
      return this.tableViewList.length;
    }
  
    getTotalVisits(): number {
      return this.tableViewList.reduce((sum, item) => sum + item.total_visits, 0);
    }
  
    getTotalObjective(): number {
      const total = this.tableViewList.reduce((sum, item) => sum + item.objectif, 0);
      return Math.round(total * 100) / 100; // Formate à 2 décimales
    }
  
    getAverageAchievement(): number {
      if (this.tableViewList.length === 0) return 0;
      const totalPerformance = this.tableViewList.reduce((sum, item) => 
        sum + this.getItemPerformance(item), 0
      );
      return totalPerformance / this.tableViewList.length;
    }
  
    // Export CSV
    exportToCSV(): void {
      if (this.tableViewList.length === 0) return;
  
      const headers = ['Pays', 'Nom', 'Titre', 'Objectif', 'Visites', 'Target', 'Performance (%)'];
      const csvContent = [
        headers.join(','),
        ...this.tableViewList.map(item => [
          item.name,
          item.signature,
          item.title,
          item.objectif,
          item.total_visits,
          item.target,
          this.getItemPerformance(item).toFixed(1)
        ].join(','))
      ].join('\n');
  
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kpi-pays-${formatDate(new Date(), 'yyyy-MM-dd', 'en-US')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    ngOnDestroy(): void {
      this.stopAutoRefresh();
    }
  
    // Méthodes pour le rafraîchissement automatique
    // Méthodes pour le rafraîchissement automatique simple
    startAutoRefresh(): void {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
      }
      
      // Rafraîchir automatiquement toutes les 30 secondes
      this.autoRefreshInterval = setInterval(() => {
        this.refreshData();
      }, 30000); // 30 secondes
    }
  
    stopAutoRefresh(): void {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval);
        this.autoRefreshInterval = undefined;
      }
    }
  
    refreshData(): void {
      const country_uuid = this.dateRange.value.country || 
        (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support' 
          ? this.countryList()[0]?.uuid 
          : this.currentUser.country_uuid);
      
      const province_uuid = this.currentUser.role != 'Managers' && this.currentUser.role != 'Support' 
        ? this.provinceList[0]?.uuid 
        : this.currentUser.province_uuid;
      
      if (country_uuid && province_uuid) {
        this.getTableView(country_uuid, province_uuid, this.start_date, this.end_date);
      }
    }
  
    // Synchronisation manuelle
    manualSync(): void {
      if (this.currentUser.role != 'Managers' && this.currentUser.role != 'Support') { 
        this.getTableView(this.countryList()[0].uuid, this.provinceList[0].uuid, this.start_date, this.end_date);
      } else { 
        this.getTableView(this.currentUser.country_uuid, this.currentUser.province_uuid, this.start_date, this.end_date);
      }
    }
  
    // Méthodes de recherche
    onSearch(): void {
      if (this.searchTerm.trim() === '') {
        this.filteredTableViewList = [...(this.tableViewList || [])];
        this.filteredGroupedData = [...(this.groupedData || [])];
      } else {
        // Filtrer la liste normale
        this.filteredTableViewList = (this.tableViewList || []).filter(item =>
          item?.signature?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          item?.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          item?.name?.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
  
        // Filtrer les données hiérarchiques
        this.filteredGroupedData = this.filterHierarchicalData(this.groupedData || [], this.searchTerm.toLowerCase());
      }
    }
  
    clearSearch(): void {
      this.searchTerm = '';
      this.onSearch();
    }
  
    getFilteredDataCount(): number {
      if (this.isHierarchicalView) {
        return this.countFilteredHierarchicalItems(this.filteredGroupedData);
      } else {
        return this.filteredTableViewList.length;
      }
    }
  
    private filterHierarchicalData(data: GroupedData[], searchTerm: string): GroupedData[] {
      return data.map(group => {
        const matchesGroup = 
          (group.title || '').toLowerCase().includes(searchTerm) ||
          (group.signature || '').toLowerCase().includes(searchTerm) ||
          (group.hierarchyType || '').toLowerCase().includes(searchTerm);
  
        let filteredChildren: GroupedData[] = [];
        if (group.children) {
          filteredChildren = this.filterHierarchicalData(group.children, searchTerm);
        }
  
        // Inclure le groupe s'il correspond ou si des enfants correspondent
        if (matchesGroup || filteredChildren.length > 0) {
          return {
            ...group,
            children: filteredChildren
          };
        }
        return null;
      }).filter(item => item !== null) as GroupedData[];
    }
  
    private countFilteredHierarchicalItems(data: GroupedData[]): number {
      let count = 0;
      data.forEach(group => {
        count++; // Compter le groupe lui-même
        if (group.children) {
          count += this.countFilteredHierarchicalItems(group.children);
        }
      });
      return count;
    }
}

