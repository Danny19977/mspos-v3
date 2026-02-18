# Système Offline-Online avec File d'Attente et Synchronisation

## Vue d'ensemble

Ce système implémente une architecture **offline-first** avec synchronisation automatique en arrière-plan pour l'application MSPOS v3. Les données sont stockées localement dans **IndexedDB** via **DexieJS** et synchronisées automatiquement avec le serveur lorsque la connexion Internet est disponible.

## Architecture

### 1. **Brands** - Mode ONLINE ONLY
- **Lecture** : Données téléchargées au démarrage et stockées localement pour consultation rapide
- **CRUD** : Nécessite une connexion Internet
- **Cache** : Mise à jour automatique lors de chaque appel réussi au serveur
- **Offline** : Consultation des données en cache uniquement, pas de modification

**Service** : `BrandService`
```typescript
// Lecture depuis le cache local avec fallback serveur
brandService.getPaginated2(page, pageSize, search).subscribe(...)

// Création/Modification/Suppression - ONLINE ONLY
brandService.create(brandData).subscribe(...)
brandService.update(uuid, brandData).subscribe(...)
brandService.delete(uuid).subscribe(...)
```

### 2. **POS (Points de Vente)** - Mode OFFLINE FIRST
- **Téléchargement initial** : Les POS de l'utilisateur sont téléchargés au premier démarrage
- **CRUD** : Toutes les opérations se font d'abord en local
- **Synchronisation** : Automatique en arrière-plan quand Internet est disponible
- **Affichage** : Toujours depuis le cache local (performance optimale)

**Service** : `PosVenteService`
```typescript
// Lecture - toujours depuis le cache local
posService.getPaginatedWithAdvancedFilters(user, page, pageSize, filters).subscribe(...)

// Création - stockage local + file d'attente de sync
posService.create(posData).subscribe(result => {
  // result.offline indique si l'opération est en attente de sync
})

// Modification - idem
posService.update(uuid, posData).subscribe(...)

// Suppression - idem
posService.delete(uuid).subscribe(...)
```

### 3. **RoutePlans** - Mode OFFLINE FIRST avec Validation Journalière
- **Limitation** : **UN SEUL Routeplan par jour** (00h00 - 23h59)
- **Source des POS** : Utilise les POS stockés en local (pas besoin d'Internet)
- **CRUD** : Offline-first avec synchronisation automatique
- **Validation** : Vérification automatique de la contrainte journalière

**Service** : `RouteplanService`
```typescript
// Vérifier s'il y a déjà un plan aujourd'hui
routeplanService.hasTodayRoutePlan(userId).then(hasToday => {
  if (hasToday) {
    // Afficher un message d'erreur
  }
})

// Obtenir le plan du jour
routeplanService.getTodayRoutePlan(userId).subscribe(...)

// Obtenir les POS locaux pour créer un plan
routeplanService.getLocalPosForRoutePlan(userId, userRole, territoryUuid).subscribe(...)

// Créer un nouveau plan (validation automatique)
routeplanService.create(routeplanData).subscribe(
  result => { /* Succès */ },
  error => { 
    // error.message contiendra le message de limitation journalière
  }
)
```

## Services de Synchronisation

### 1. **DataSyncService** - Téléchargement Initial
Gère le téléchargement initial des données au premier démarrage ou lors d'un rafraîchissement manuel.

```typescript
// Télécharger les données initiales
await dataSyncService.downloadInitialData(userId, userRole)

// Vérifier si les données locales existent
const hasData = await dataSyncService.hasLocalData()

// Rafraîchir les données manuellement
await dataSyncService.refreshData(userId, userRole)

// Suivre la progression
dataSyncService.syncProgress$.subscribe(progress => {
  console.log(`${progress.current}/${progress.total} - ${progress.entity}`)
})
```

### 2. **SyncQueueService** - File d'Attente de Synchronisation
Gère la file d'attente des opérations offline en attente de synchronisation.

```typescript
// Obtenir le nombre d'opérations en attente
const count = await syncQueueService.getPendingCount()

// Traiter la file d'attente manuellement
const result = await syncQueueService.processQueue()
console.log(`${result.success} réussies, ${result.failed} échouées`)

// Observer les opérations en attente
syncQueueService.pendingCount$.subscribe(count => {
  // Afficher un badge avec le nombre
})
```

### 3. **AutoSyncService** - Synchronisation Automatique
Gère la synchronisation automatique en arrière-plan.

**Fonctionnalités :**
- ✅ Synchronisation automatique lors du retour en ligne
- ✅ Synchronisation périodique (toutes les 5 minutes par défaut)
- ✅ Téléchargement initial automatique si nécessaire
- ✅ Rafraîchissement automatique des données anciennes (> 24h)

```typescript
// Démarrer la synchronisation automatique (déjà fait dans MarketModule)
autoSyncService.start()

// Synchroniser immédiatement
await autoSyncService.syncNow()

// Télécharger les données initiales si nécessaire
await autoSyncService.downloadInitialDataIfNeeded(userId, userRole)

// Forcer un rafraîchissement
await autoSyncService.forceRefresh(userId, userRole)

// Obtenir les statistiques
const stats = await autoSyncService.getSyncStats()
// { pendingCount, lastSyncTime, isOnline, isSyncing }

// Réessayer les opérations échouées
await autoSyncService.retryFailedOperations()

// Changer l'intervalle de synchronisation
autoSyncService.setSyncInterval(10 * 60 * 1000) // 10 minutes
```

### 4. **NetworkService** - Détection de Connexion
Détecte automatiquement les changements de connectivité.

```typescript
// Vérifier l'état de la connexion
if (networkService.isOnline()) {
  // Online
}

// Observer les changements
networkService.online$.subscribe(isOnline => {
  console.log(isOnline ? 'ONLINE' : 'OFFLINE')
})

// Attendre le retour en ligne
await networkService.waitForOnline().toPromise()
```

## Flux de Données

### Mode ONLINE
```mermaid
User Action → Service → Local DB + Sync Queue → Server (background) → Local DB Update
```

1. L'utilisateur effectue une action (create/update/delete)
2. Les données sont **immédiatement** stockées en local (IndexedDB)
3. L'opération est ajoutée à la **file d'attente de synchronisation**
4. La synchronisation avec le serveur se fait **en arrière-plan**
5. Une fois synchronisé, le statut `sync_status` passe de `pending` à `synced`
6. L'UUID temporaire est remplacé par l'UUID du serveur (pour les créations)

### Mode OFFLINE
```mermaid
User Action → Service → Local DB + Sync Queue → [Queued until online]
```

1. L'utilisateur effectue une action
2. Les données sont stockées en local avec `sync_status: 'pending'`
3. L'opération est mise en file d'attente
4. **Aucune tentative de connexion au serveur**
5. L'interface affiche que l'opération sera synchronisée plus tard
6. Quand la connexion revient, AutoSyncService synchronise automatiquement

### Retour en Ligne
```mermaid
Network: Offline → Online → AutoSyncService.syncNow() → SyncQueue.processQueue()
```

1. NetworkService détecte le retour en ligne
2. AutoSyncService est notifié
3. La file d'attente est traitée automatiquement
4. Les données locales sont rafraîchies depuis le serveur

## Initialisation au Démarrage

Le système s'initialise automatiquement au chargement du **MarketModule** :

```typescript
@NgModule({
  // ...
})
export class MarketModule {
  constructor(private autoSyncService: AutoSyncService) {
    // Démarrage automatique
    this.autoSyncService.start()
  }
}
```

**Ce qui se passe :**
1. ✅ AutoSyncService démarre
2. ✅ Vérifie si des données locales existent
3. ✅ Si non, télécharge les données initiales (Brands + POS + RoutePlans)
4. ✅ Si oui, vérifie si elles sont anciennes (> 24h) et rafraîchit si nécessaire
5. ✅ Traite la file d'attente si des opérations sont en attente
6. ✅ Lance la synchronisation périodique

## Base de Données Locale (DexieJS)

### Tables
```typescript
- brands           // Marques (téléchargées au démarrage)
- pos              // Points de vente (téléchargés selon le rôle utilisateur)
- routePlans       // Plans de route de l'utilisateur
- routePlanItems   // Items des plans de route
- syncQueue        // File d'attente de synchronisation
```

### Schéma de Synchronisation
Tous les enregistrements ont les champs suivants :
- `sync_status`: `'synced' | 'pending' | 'error'`
- `temp_id`: UUID temporaire pour les créations offline

## Validation Journalière des RoutePlans

La limitation **"un seul Routeplan par jour"** est gérée automatiquement :

```typescript
// Lors de la création
routeplanService.create(data).subscribe(
  result => {
    // Succès - plan créé
  },
  error => {
    if (error.message.includes('déjà créé un plan')) {
      // L'utilisateur a déjà un plan aujourd'hui
    }
  }
)
```

**Logique :**
- Vérifie dans IndexedDB si un RoutePlan existe avec `CreatedAt` entre 00h00 et 23h59 du jour actuel
- Si oui, rejette la création avec un message d'erreur
- Si non, autorise la création

## Statistiques et Monitoring

### Obtenir les statistiques du Routeplan du jour
```typescript
const stats = await routeplanService.getTodayStats(userId)
// {
//   hasPlan: boolean,
//   planUuid?: string,
//   totalPosInPlan?: number,
//   createdAt?: Date
// }
```

### Obtenir les statistiques de synchronisation
```typescript
const stats = await autoSyncService.getSyncStats()
// {
//   pendingCount: number,
//   lastSyncTime: Date | null,
//   isOnline: boolean,
//   isSyncing: boolean
// }
```

## Gestion des Erreurs

### Opération échouée
Si une synchronisation échoue :
1. L'opération reste dans la file d'attente avec `status: 'failed'`
2. Un compteur de tentatives (`retryCount`) est incrémenté
3. Maximum 3 tentatives automatiques
4. Possibilité de réessayer manuellement :
```typescript
await autoSyncService.retryFailedOperations()
```

### Conflit de données
En cas de conflit entre données locales et serveur :
- Les données du serveur ont toujours la priorité
- Les données locales sont écrasées lors de la synchronisation
- Pour les RoutePlans : la validation journalière empêche les doublons

## Bonnes Pratiques

### 1. Affichage de l'état de synchronisation
```typescript
// Afficher un badge avec le nombre d'opérations en attente
syncQueueService.pendingCount$.subscribe(count => {
  // Afficher: "🔄 X en attente"
})

// Afficher l'état de la connexion
networkService.online$.subscribe(isOnline => {
  // Afficher: "🟢 En ligne" ou "🔴 Hors ligne"
})
```

### 2. Feedback utilisateur
```typescript
posService.create(data).subscribe(result => {
  if (result.offline) {
    toast.info('✅ POS créé localement, sera synchronisé à la reconnexion')
  } else {
    toast.success('✅ POS créé et synchronisé')
  }
})
```

### 3. Bouton de synchronisation manuelle
```typescript
async syncManually() {
  if (!this.networkService.isOnline()) {
    toast.error('❌ Connexion Internet requise')
    return
  }
  
  try {
    await this.autoSyncService.syncNow()
    toast.success('✅ Synchronisation réussie')
  } catch (error) {
    toast.error('❌ Erreur de synchronisation')
  }
}
```

### 4. Bouton de rafraîchissement des données
```typescript
async refreshData() {
  try {
    await this.autoSyncService.forceRefresh(userId, userRole)
    toast.success('✅ Données actualisées')
  } catch (error) {
    toast.error('❌ Connexion Internet requise')
  }
}
```

## Endpoints Backend Requis

Pour que le système fonctionne, le backend doit fournir ces endpoints :

```
GET  /api/brands                    # Tous les brands
GET  /api/pos/user/:userId          # POS de l'utilisateur selon son rôle
GET  /api/routeplans/user/:userId   # RoutePlans de l'utilisateur

POST   /api/brands                  # Créer un brand
PUT    /api/brands/:uuid            # Modifier un brand
DELETE /api/brands/:uuid            # Supprimer un brand

POST   /api/pos                     # Créer un POS
PUT    /api/pos/:uuid               # Modifier un POS
DELETE /api/pos/:uuid               # Supprimer un POS

POST   /api/routeplans              # Créer un routeplan
PUT    /api/routeplans/:uuid        # Modifier un routeplan
DELETE /api/routeplans/:uuid        # Supprimer un routeplan
```

## Résumé des Comportements

| Entité | Mode | Lecture | Création | Modification | Suppression |
|--------|------|---------|----------|--------------|-------------|
| **Brand** | Online Only | Cache + Serveur | Serveur | Serveur | Serveur |
| **POS** | Offline First | Cache local | Local + Queue | Local + Queue | Local + Queue |
| **RoutePlan** | Offline First | Cache local | Local + Queue + Validation 1/jour | Local + Queue | Local + Queue |

## Support

Pour toute question ou problème :
1. Vérifier les logs dans la console du navigateur
2. Vérifier l'état de la file d'attente : `await syncQueueService.getAllOperations()`
3. Vérifier IndexedDB dans les DevTools du navigateur
4. Forcer une synchronisation : `await autoSyncService.syncNow()`
5. Nettoyer et rafraîchir : `await autoSyncService.forceRefresh(userId, userRole)`
