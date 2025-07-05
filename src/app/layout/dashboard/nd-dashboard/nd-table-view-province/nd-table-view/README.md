# Composant ND Table View avec Accordéon

## Description

Ce composant affiche les données de distribution numérique organisées par province dans un format accordéon expansible. Chaque province est représentée par un header cliquable qui révèle les données détaillées dans le body.

## Fonctionnalités

### Header de l'Accordéon
- **Nom de la province** avec icône de localisation
- **Badge avec le nombre d'enregistrements** pour cette province
- **Indicateur de performance moyenne** (pourcentage moyen)
- **Animation fluide** d'ouverture/fermeture

### Body de l'Accordéon
- **Tableau détaillé** avec les données de chaque brand
- **Badges colorés** pour les pourcentages selon les seuils :
  - 🟢 Vert (≥95%) : Performance excellente
  - 🟡 Jaune (80-94%) : Performance acceptable
  - 🔴 Rouge (<80%) : Performance à améliorer
- **Boutons d'action** pour voir les détails et plus d'informations
- **Statistiques résumées** par province :
  - Total Présence
  - Total Visites
  - Meilleur Pourcentage
  - Nombre de Brands

## Utilisation

```html
<app-nd-table-view 
  [tableView]="yourTableData" 
  [isLoading]="isLoadingState">
</app-nd-table-view>
```

## Structure des Données

Le composant attend un tableau d'objets `TableViewModel` :

```typescript
interface TableViewModel {
  name: string;        // Nom de la province
  brand: string;       // Nom de la brand
  pourcent: number;    // Pourcentage de performance
  presence: number;    // Nombre de présences
  visits: number;      // Nombre de visites
}
```

## Méthodes Disponibles

### Groupement des données
- `getGroupedData()`: Organise les données par province

### Calculs statistiques
- `getAveragePercentage(data)`: Calcule le pourcentage moyen
- `getTotalPresence(data)`: Somme des présences
- `getTotalVisits(data)`: Somme des visites
- `getMaxPercentage(data)`: Pourcentage maximum
- `getUniqueBrands(data)`: Nombre de brands uniques

### Actions
- `showDetails(item)`: Affiche les détails d'un élément

## Styles et Thèmes

Le composant inclut :
- **Design responsif** adaptatif mobile/desktop
- **Animations fluides** pour les interactions
- **Support du mode sombre** (optionnel)
- **Gradients et ombres** pour un rendu moderne
- **Hover effects** sur les éléments interactifs

## Exemple Complet

```typescript
// Dans votre composant parent
export class ParentComponent {
  tableData: TableViewModel[] = [
    {
      name: "Kinshasa",
      brand: "Equateur",
      pourcent: 96,
      presence: 150,
      visits: 200
    },
    {
      name: "Kinshasa", 
      brand: "MTC",
      pourcent: 85,
      presence: 120,
      visits: 180
    },
    {
      name: "Lubumbashi",
      brand: "Equateur", 
      pourcent: 78,
      presence: 90,
      visits: 110
    }
  ];
  
  isLoading = false;
}
```

```html
<!-- Dans votre template parent -->
<div class="container-fluid">
  <div class="row">
    <div class="col-12">
      <app-nd-table-view 
        [tableView]="tableData" 
        [isLoading]="isLoading">
      </app-nd-table-view>
    </div>
  </div>
</div>
```

## Personnalisation

### Couleurs des badges
Vous pouvez modifier les couleurs des badges en modifiant les classes CSS dans le fichier SCSS :

```scss
.badge {
  &.bg-success { /* Performance excellente */ }
  &.bg-warning { /* Performance acceptable */ }
  &.bg-danger { /* Performance faible */ }
}
```

### Seuils de performance
Les seuils peuvent être modifiés dans le template HTML :

```html
@if (item.pourcent >= 95) { 
  <!-- Excellent -->
}
@else if (item.pourcent >= 80) {
  <!-- Acceptable -->
}
@else {
  <!-- À améliorer -->
}
```

## Accessibilité

Le composant respecte les standards d'accessibilité :
- Navigation au clavier
- Labels ARIA appropriés
- Contrast ratios conformes
- Support des lecteurs d'écran

## Performance

- **Lazy loading** des données dans l'accordéon
- **TrackBy functions** pour les boucles *ngFor
- **OnPush change detection** (recommandé)
- **Optimisation des re-rendus**
