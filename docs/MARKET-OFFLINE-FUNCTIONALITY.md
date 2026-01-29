# Module Market - Fonctionnalité Offline/Online

Ce document explique la fonctionnalité offline/online implémentée dans le module Market de MSPOS-v3.

## Vue d'ensemble

Le module Market fonctionne maintenant en mode offline et online avec synchronisation automatique. Les données sont stockées localement dans IndexedDB et synchronisées avec le serveur lorsque la connexion internet est rétablie.

## Entités supportées

Les entités suivantes fonctionnent en mode offline :

### 1. **Brands (Marques)**
- ✅ Disponibles offline
- ✅ Filtrées par province de l'utilisateur courant
- ✅ Création, modification, suppression en offline
- ✅ Synchronisation automatique

### 2. **POS (Points de vente)**
- ✅ Disponibles offline
- ✅ Filtrés selon le rôle utilisateur (province, area, subarea, commune)
- ✅ Création, modification, suppression en offline
- ✅ Synchronisation automatique

### 3. **Route Plans (Plans de route)**
- ✅ Disponibles offline
- ✅ Filtrés par utilisateur
- ✅ Création, modification en offline
- ✅ Synchronisation automatique

### 4. **POS Forms (Formulaires de visite)**
- ✅ Disponibles offline
- ✅ Création avec géolocalisation en offline
- ✅ Ajout d'items de formulaire en offline
- ✅ Synchronisation automatique
- ✅ Mise à jour du statut de route plan

## Architecture

### Services principaux

#### OfflineService (`src/app/shared/services/offline.service.ts`)
- Intercepte tous les appels HTTP
- Détecte l'état online/offline
- Route vers IndexedDB en mode offline
- Cache les réponses en mode online
- Applique les filtres basés sur le rôle utilisateur

#### SyncQueueService (`src/app/shared/services/sync-queue.service.ts`)
- Gère la file d'attente de synchronisation
- Génère des UUID temporaires pour les entités créées offline
- Traite la queue lors de la reconnexion
- Mappe les IDs temporaires aux IDs serveur
- Gère les retries et les erreurs

#### SyncService (`src/app/services/sync.service.ts`)
- Détecte le retour de connexion internet
- Déclenche la synchronisation automatique
- Synchronise les données utilisateur et market

### Base de données locale

**IndexedDB (via Dexie)**
```typescript
// Tables principales
- brands: Marques
- pos: Points de vente
- posForms: Formulaires de visite
- posformItems: Items de formulaire
- routePlans: Plans de route
- routePlanItems: Items de plan de route
- syncQueue: File d'attente de synchronisation
```

## Workflow

### Mode Online

1. L'utilisateur effectue une action (create/update/delete)
2. La requête est envoyée au serveur
3. La réponse est mise en cache dans IndexedDB
4. L'UI est mise à jour
5. Le statut `sync_status` est marqué comme `'synced'`

### Mode Offline

1. L'utilisateur effectue une action (create/update/delete)
2. Un UUID temporaire est généré pour les nouvelles entités
3. L'opération est ajoutée à la `syncQueue`
4. Les données sont sauvegardées dans IndexedDB
5. L'UI est mise à jour (optimistic update)
6. Le statut `sync_status` est marqué comme `'pending'`

### Retour en ligne

1. NetworkService détecte la reconnexion
2. SyncService déclenche `syncMarketData()`
3. SyncQueueService traite la queue :
   - Pour chaque opération en attente
   - Envoie la requête au serveur
   - Mappe les IDs temporaires aux IDs serveur
   - Met à jour IndexedDB
   - Marque l'opération comme `'completed'`
4. Les badges de synchronisation sont mis à jour

## Composants UI

### SyncStatusComponent
Affiche dans le header :
- 🟢 **En ligne** / 🔴 **Hors ligne**
- Nombre d'opérations en attente
- Indicateur de synchronisation en cours
- Bouton de synchronisation manuelle
- Dernière heure de synchronisation

### RecordSyncBadgeComponent
Badge sur chaque enregistrement :
- ✅ **Synchronisé** : Données à jour
- ⏳ **En attente** : Attend synchronisation
- ⚠️ **Erreur** : Erreur de synchronisation
- 📴 **Hors ligne** : Créé en offline

## Configuration

### Service Worker (ngsw-config.json)

Les endpoints API sont mis en cache :
```json
{
  "dataGroups": [
    {
      "name": "api-brands",
      "urls": ["https://mspos-api-dvp8.onrender.com/api/brands/**"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "1d",
        "strategy": "freshness"
      }
    },
    // ... autres endpoints
  ]
}
```

### Modèles de données

Tous les modèles incluent maintenant :
```typescript
interface IModel {
  // ... champs existants
  
  // Champs de synchronisation offline
  sync_status?: 'synced' | 'pending' | 'error';
  temp_id?: string; // UUID temporaire pour entités offline
}
```

## Filtrage par rôle

Le système applique automatiquement des filtres basés sur le rôle :

| Rôle | Filtre appliqué |
|------|----------------|
| **Manager** | Toutes les données |
| **ASM** | `province_uuid` |
| **Supervisor** | `area_uuid` |
| **DR** | `sub_area_uuid` |
| **Cyclo** | `commune_uuid` |

## Utilisation

### Pour les développeurs

#### Modifier un service existant
Les services héritant de `ApiService` bénéficient automatiquement du mode offline :

```typescript
// Avant
export class BrandService extends ApiService {
  endpoint: string = `${environment.apiUrl}/brands`;
}

// Aucun changement nécessaire !
// ApiService utilise maintenant OfflineService automatiquement
```

#### Ajouter un badge de synchronisation

```html
<app-record-sync-badge 
  [syncStatus]="record.sync_status"
  [showLabel]="true">
</app-record-sync-badge>
```

#### Forcer une synchronisation manuelle

```typescript
constructor(private syncQueue: SyncQueueService) {}

async forceSync() {
  await this.syncQueue.processQueue();
}
```

### Pour les utilisateurs

1. **Travailler normalement** : Créez, modifiez, supprimez des données comme d'habitude
2. **Vérifier le statut** : Regardez le badge dans le header
3. **Synchroniser** : Cliquez sur le bouton "Synchroniser" si nécessaire
4. **Consulter les opérations en attente** : Le nombre s'affiche automatiquement

## Gestion des erreurs

### Erreurs de synchronisation

Si une opération échoue :
1. Elle est marquée comme `'error'`
2. Le compteur de retry est incrémenté
3. Maximum 3 tentatives automatiques
4. Après 3 échecs, l'opération reste dans la queue
5. L'utilisateur peut la synchroniser manuellement

### Conflits de données

Stratégie actuelle : **Last-Write-Wins**
- Les données du serveur écrasent les données locales
- Basé sur le timestamp `UpdatedAt`
- L'utilisateur est notifié en cas de conflit

### Nettoyage

- Opérations complétées : Supprimées après 24h
- Opérations échouées : Conservées pour retry manuel
- Cache local : Peut être vidé via les DevTools

## Débogage

### Console DevTools

```javascript
// Voir toutes les opérations en queue
await db.syncQueue.toArray()

// Voir les données locales
await db.brands.toArray()
await db.pos.toArray()
await db.posForms.toArray()

// Vider la queue
await db.syncQueue.clear()

// Vider toutes les données locales
await db.delete()
```

### Logs

Activez les logs dans la console :
```
🔄 Operation queued: create brand
📴 Offline mode: GET /api/brands/all/paginate
💾 Cached brand data locally
📦 Retrieved brand from cache
✅ Synced: create brand
```

## Limitations

1. **Taille du cache** : IndexedDB limité à ~50MB par domaine
2. **Conflits** : Pas de résolution avancée des conflits
3. **Images** : Les uploads d'images ne fonctionnent pas en offline
4. **Recherche** : La recherche en mode offline est basique (pas de backend filtering)

## Améliorations futures

- [ ] Résolution de conflits avec UI dédiée
- [ ] Compression des données en cache
- [ ] Synchronisation différentielle (delta sync)
- [ ] Export/Import des données offline
- [ ] Notification push pour les mises à jour
- [ ] Background sync API
- [ ] Gestion des pièces jointes offline

## Support

Pour toute question ou problème :
1. Vérifiez les logs dans la console
2. Consultez l'état d'IndexedDB dans DevTools > Application > Storage
3. Contactez l'équipe de développement

---

**Version** : 1.0.0  
**Date** : 29 janvier 2026  
**Auteur** : GitHub Copilot
