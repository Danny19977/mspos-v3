# Fonctionnalité de Rafraîchissement Automatique

## Description
Cette fonctionnalité permet de rafraîchir automatiquement les données du tableau KPI à intervalles réguliers.

## Fonctionnalités

### 1. Activation/Désactivation
- Bouton toggle "Auto"/"Manuel" pour activer/désactiver le rafraîchissement automatique
- Indicateur visuel : vert quand activé, gris quand désactivé

### 2. Intervalles de Rafraîchissement
- 10 secondes
- 30 secondes (par défaut)
- 1 minute
- 5 minutes
- 10 minutes

### 3. Contrôles Disponibles
- **Bouton Auto/Manuel** : Active ou désactive le rafraîchissement automatique
- **Sélecteur d'intervalle** : Permet de choisir la fréquence de rafraîchissement
- **Bouton de rafraîchissement manuel** : Force un rafraîchissement immédiat
- **Compte à rebours** : Affiche le temps restant avant le prochain rafraîchissement
- **Dernière mise à jour** : Affiche l'heure de la dernière actualisation

### 4. Comportement
- Le rafraîchissement automatique se redémarre automatiquement lors des changements de filtres (pays, dates)
- Les intervalles sont remis à zéro lors d'un rafraîchissement manuel
- Le composant nettoie automatiquement les intervalles lors de sa destruction

### 5. Interface Utilisateur
- Design responsive qui s'adapte aux écrans mobiles
- Animations visuelles pour une meilleure expérience utilisateur
- Couleurs et icônes intuitives

## Utilisation Technique

### Méthodes Principales
```typescript
startAutoRefresh()    // Démarre le rafraîchissement automatique
stopAutoRefresh()     // Arrête le rafraîchissement automatique
toggleAutoRefresh()   // Bascule entre activé/désactivé
refreshData()         // Rafraîchit les données manuellement
setRefreshInterval(seconds) // Change l'intervalle de rafraîchissement
```

### Propriétés
```typescript
isAutoRefreshEnabled: boolean     // État du rafraîchissement automatique
refreshIntervalSeconds: number    // Intervalle en secondes
refreshCountdown: number          // Compte à rebours actuel
lastRefreshTime: Date            // Heure de la dernière mise à jour
```

## Notes Importantes
- Le rafraîchissement automatique respecte les filtres actuels (pays sélectionné, plage de dates)
- Les données hiérarchiques sont reconstruites à chaque rafraîchissement
- Les états d'expansion/contraction des groupes sont préservés lors du rafraîchissement
