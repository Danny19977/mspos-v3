# KPI Table View Country Component

## Vue Hiérarchique Géographique Implémentée ✅

### Organisation Hiérarchique
La table organise maintenant les données selon la hiérarchie géographique suivante :
1. **ASM** (Area Sales Manager) - Niveau le plus élevé
2. **Supervisor** - Responsable de plusieurs DRs
3. **DR** (District Representative) - Gestionnaire de terrain
4. **Cyclo** - Agent de terrain

### Fonctionnalités Principales

#### 1. Vue Hiérarchique avec Totalisation
- **Navigation par niveaux** : Expansion/contraction des niveaux hiérarchiques
- **Calculs automatiques** : Les performances remontent automatiquement dans la hiérarchie
- **Visites personnelles vs équipe** : Distinction entre visites propres et celles de l'équipe
- **Performance globale** : Calcul des pourcentages d'atteinte pour chaque niveau

#### 2. Tableau de Résumé Exécutif
- **Total Agents** : Nombre total d'agents dans la région
- **Total Visites** : Somme de toutes les visites effectuées
- **Objectif Total** : Cumul des objectifs de tous les agents
- **Atteinte Moyenne** : Performance moyenne pondérée

#### 3. Double Vue (Hiérarchique / Normale)
- **Vue Hiérarchique** : Organisation par niveaux avec totalisations
- **Vue Normale** : Liste plate de tous les agents
- **Basculement instantané** : Bouton toggle pour changer de vue

#### 4. Indicateurs Visuels
- **Badges colorés par niveau** :
  - 🔵 ASM (Bleu)
  - 🟢 Supervisor (Vert)  
  - 🟡 DR (Jaune)
  - ⚪ Cyclo (Gris)
- **Performance colorée** :
  - 🟢 ≥100% (Objectif atteint)
  - 🟡 ≥80% (Proche objectif)
  - 🔴 <80% (Sous-performance)

#### 5. Actions et Navigation
- **Développer/Réduire** : Contrôle de l'affichage hiérarchique
- **Export CSV** : Téléchargement des données
- **Détails** : Accès aux informations détaillées de chaque agent

### Structure des Données

#### Interface GroupedData
```typescript
interface GroupedData {
  title: string;                    // Nom/titre de la personne
  signature: string;                // Signature
  level: number;                    // Niveau hiérarchique (0-3)
  total_visits: number;             // Total des visites
  objectif: number;                 // Objectif de visites
  target: number;                   // Target
  achievement_percentage: number;   // Pourcentage d'atteinte
  count: number;                    // Nombre d'éléments
  isExpanded: boolean;              // État d'expansion
  children?: GroupedData[];         // Enfants dans la hiérarchie
  originalData?: KPITableViewPriceModel; // Données originales
  groupKey?: string;                // Clé de groupe
  hierarchyType?: string;           // Type hiérarchique
  personalVisits?: number;          // Visites personnelles
  teamVisits?: number;              // Visites d'équipe
}
```

### Calculs de Performance

#### 1. Visites Personnelles
- Pour les **Cyclos** : Toutes leurs visites sont personnelles
- Pour les **managers** : Visites qu'ils effectuent directement

#### 2. Visites d'Équipe
- Somme des visites de tous les agents sous leur responsabilité
- Calcul récursif remontant dans la hiérarchie

#### 3. Performance Calculée
```
Performance (%) = (Total Visites / Objectif) × 100
```

### Utilisation

#### 1. Chargement Initial
```typescript
// Les données sont automatiquement organisées en hiérarchie
this.groupedData = this.organizeHierarchicalData(this.tableViewList);
```

#### 2. Basculement de Vue
```typescript
// Changer entre vue hiérarchique et normale
toggleHierarchicalView(): void {
  this.isHierarchicalView = !this.isHierarchicalView;
}
```

#### 3. Contrôle d'Expansion
```typescript
// Développer tous les niveaux
expandAll(): void {
  this.expandCollapseAll(this.groupedData, true);
}

// Réduire tous les niveaux
collapseAll(): void {
  this.expandCollapseAll(this.groupedData, false);
}
```

#### 4. Export de Données
```typescript
// Export CSV avec données formatées
exportToCSV(): void {
  // Génère un fichier CSV avec toutes les données
}
```

### Styles et Apparence

#### Classes CSS Principales
- `.hierarchy-level-0` à `.hierarchy-level-3` : Styles par niveau
- `.expand-toggle` : Boutons d'expansion
- `.badge` variants : Badges colorés
- `.achievement-*` : Indicateurs de performance

#### Responsive Design
- Adaptation mobile avec réduction des polices
- Bordures simplifiées sur petits écrans
- Boutons adaptés aux interfaces tactiles

### Avantages de Cette Implémentation

1. **Visibilité Complète** : Voir les performances à tous les niveaux
2. **Drill-Down Facile** : Navigation intuitive dans la hiérarchie
3. **Totalisations Automatiques** : Calculs précis remontant la hiérarchie
4. **Performance Visuelle** : Indicateurs colorés immédiats
5. **Export Facilité** : Données exploitables en CSV
6. **Double Vue** : Flexibilité d'affichage selon les besoins

### Exemple de Hiérarchie

```
📊 ASM - Jean Dupont (Performance: 95%)
├── 👥 Supervisor - Marie Martin (Performance: 98%)
│   ├── 🎯 DR - Paul Durand (Performance: 102%)
│   │   ├── 🚴 Cyclo - Luc Bernard (15 visites)
│   │   └── 🚴 Cyclo - Anna Petit (12 visites)
│   └── 🎯 DR - Sophie Blanc (Performance: 89%)
│       ├── 🚴 Cyclo - Marc Rouge (8 visites)
│       └── 🚴 Cyclo - Julie Vert (10 visites)
└── 👥 Supervisor - Pierre Noir (Performance: 87%)
    └── 🎯 DR - Claire Bleu (Performance: 85%)
        ├── 🚴 Cyclo - Tom Orange (6 visites)
        └── 🚴 Cyclo - Lisa Jaune (9 visites)
```

Cette organisation permet de voir instantanément :
- Les performances à chaque niveau de management
- L'impact de chaque équipe sur les résultats globaux
- Les agents individuels et leurs contributions
- Les totalisations remontant automatiquement

- **Calcul optimisé** : Les totaux hiérarchiques sont calculés une seule fois
- **Mise à jour intelligente** : Seules les données nécessaires sont recalculées
- **Affichage progressif** : Les niveaux peuvent être développés à la demande
