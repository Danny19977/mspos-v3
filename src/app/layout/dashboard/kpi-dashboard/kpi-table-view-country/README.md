# KPI Table View Country Component

## Fonctionnalités complétées

### 1. Vue Hiérarchique des Données
- **Affichage hiérarchique** : ASM → Supervisor → DR → Cyclo
- **Navigation par niveaux** : Expansion/contraction des niveaux
- **Indentation visuelle** : Chaque niveau a son propre style et indentation
- **Badges de couleur** : Différenciation visuelle par niveau hiérarchique

### 2. Statistiques de Visites Détaillées
- **Visites personnelles** : Visites effectuées directement par la personne
- **Visites d'équipe** : Somme des visites de tous les membres sous cette personne
- **Total des visites** : Personnel + Équipe pour les managers
- **Calcul automatique** : Les totaux remontent automatiquement dans la hiérarchie

### 3. Calcul des Performances
- **Pourcentage d'atteinte** : (Visites réalisées / Objectif) × 100
- **Badges colorés** : 
  - 🟢 Vert : ≥ 100% (Objectif atteint)
  - 🟡 Jaune : ≥ 80% (Proche de l'objectif)
  - 🔴 Rouge : < 80% (Sous l'objectif)
- **Affichage avec précision** : Arrondi à 1 décimale

### 4. Interface Utilisateur Améliorée
- **Deux vues disponibles** :
  - Vue hiérarchique : Structure organisationnelle
  - Vue normale : Liste plate des agents
- **Résumé statistique** : Cartes d'information en haut
  - Total des agents
  - Total des visites
  - Atteinte moyenne
  - Objectif total

### 5. Fonctionnalités d'Export
- **Export CSV** : Téléchargement des données au format CSV
- **Nom de fichier automatique** : kpi-pays-YYYY-MM-DD.csv
- **Données formatées** : Toutes les colonnes importantes incluses

### 6. Gestion des Erreurs et États
- **Indicateur de chargement** : Spinner pendant le chargement
- **Message d'absence de données** : Affichage informatif quand aucune donnée
- **Gestion d'erreur** : Récupération gracieuse en cas d'erreur API

### 7. Filtres et Sélection
- **Sélection de pays** : Dropdown pour choisir le pays
- **Filtre de dates** : Sélection de période avec date range picker
- **Mise à jour automatique** : Rechargement des données après changement de filtre

### 8. Actions sur les Données
- **Boutons d'expansion** : Développer/réduire les niveaux hiérarchiques
- **Bouton détails** : Accès aux informations détaillées de chaque agent
- **Navigation** : Liens vers les pages de détail par zone

## Structure des Données

### Interface GroupedData
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

## Styles CSS Personnalisés

### Classes Hiérarchiques
- `.hierarchy-level-0` : ASM (Bleu, gras)
- `.hierarchy-level-1` : Supervisor (Vert, semi-gras)
- `.hierarchy-level-2` : DR (Jaune)
- `.hierarchy-level-3` : Cyclo (Gris)

### Classes Utilitaires
- `.visit-breakdown` : Affichage structuré des visites
- `.expand-toggle` : Boutons d'expansion/contraction
- `.badge` : Badges de pourcentage colorés

## Utilisation

1. **Chargement initial** : Sélection automatique du premier pays
2. **Changement de pays** : Utiliser le dropdown de sélection
3. **Changement de période** : Utiliser le date range picker
4. **Navigation hiérarchique** : Cliquer sur les boutons d'expansion
5. **Export de données** : Utiliser le bouton "Exporter"
6. **Basculer les vues** : Utiliser le bouton de toggle vue

## Performance

- **Calcul optimisé** : Les totaux hiérarchiques sont calculés une seule fois
- **Mise à jour intelligente** : Seules les données nécessaires sont recalculées
- **Affichage progressif** : Les niveaux peuvent être développés à la demande
