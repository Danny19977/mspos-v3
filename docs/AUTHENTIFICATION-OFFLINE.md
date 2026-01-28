# Système d'Authentification Offline/Online

## 📋 Vue d'ensemble

Ce système permet à l'application MSPOS V3 de fonctionner en mode **offline** (sans internet) et **online** (avec internet) avec une synchronisation automatique.

## 🏗️ Architecture

### Services créés

1. **LocalDbService** (`src/app/services/local-db.service.ts`)
   - Gère IndexedDB avec Dexie.js
   - Stocke **uniquement** l'utilisateur actuellement connecté (pas tous les utilisateurs)
   - Sauvegarde : identifiant, mot de passe hashé (SHA-256), token, données utilisateur

2. **NetworkService** (`src/app/services/network.service.ts`)
   - Détecte l'état de connexion (online/offline)
   - Émet des événements lors des changements de connexion
   - Utilise `navigator.onLine` et les événements window

3. **CryptoService** (`src/app/services/crypto.service.ts`)
   - Hash les mots de passe avec SHA-256 (SubtleCrypto natif)
   - Compare les mots de passe hashés
   - Pas besoin de bibliothèque externe

4. **SyncService** (`src/app/services/sync.service.ts`)
   - S'initialise automatiquement au démarrage de l'app
   - Écoute le retour de connexion internet
   - Synchronise automatiquement les données utilisateur avec le backend
   - Met à jour le token si nécessaire

### Modifications des fichiers existants

- **AuthService** : Logique d'authentification offline/online
- **LoginComponent** : Affiche l'état de connexion et gère les deux modes
- **AppComponent** : Initialise le SyncService au démarrage

## 🔄 Flux d'authentification

### Mode ONLINE (première connexion)

```
1. Utilisateur saisit identifiant + mot de passe
2. Angular appelle le backend (/auth/login)
3. Backend valide et retourne un token
4. Angular :
   - Hash le mot de passe (SHA-256)
   - Sauvegarde dans IndexedDB : {identifier, passwordHash, token, userData}
   - Stocke le token dans localStorage
5. Redirection selon le rôle
```

### Mode OFFLINE (connexion suivante sans internet)

```
1. Utilisateur saisit identifiant + mot de passe
2. Angular détecte : navigator.onLine === false
3. Angular :
   - Récupère l'utilisateur depuis IndexedDB
   - Hash le mot de passe saisi
   - Compare avec le passwordHash stocké
4. Si correspondance :
   - Restaure le token depuis IndexedDB
   - Charge les données utilisateur locales
   - Redirection selon le rôle
5. Sinon :
   - Affiche "Identifiants incorrects"
```

### Retour de connexion (Synchronisation automatique)

```
1. NetworkService détecte le retour d'internet
2. SyncService s'active automatiquement
3. Synchronisation :
   - Récupère les données fraîches du backend
   - Met à jour IndexedDB
   - Vérifie la validité du token
4. Si token invalide :
   - Nettoie IndexedDB et localStorage
   - Force la reconnexion
```

## 🎯 Points importants

### Sécurité

- ✅ Mot de passe hashé en SHA-256 (jamais stocké en clair)
- ✅ Token JWT stocké localement
- ✅ Comparaison cryptographique côté client
- ⚠️ Le hash SHA-256 seul n'est pas salty (acceptable pour usage offline local)

### Performance

- ✅ IndexedDB pour stockage rapide
- ✅ Un seul utilisateur stocké (pas de pollution de données)
- ✅ Synchronisation asynchrone et non-bloquante
- ✅ Détection réseau native du navigateur

### UX

- ✅ Indicateur visuel online/offline sur la page de login
- ✅ Messages toastr pour informer l'utilisateur
- ✅ Transition transparente entre les modes
- ✅ Synchronisation silencieuse en arrière-plan

## 📱 Interface utilisateur

### Page de login

- **Badge vert** : "En ligne" (icône wifi)
- **Badge orange** : "Mode hors ligne" (icône wifi-off)
- Message lors de la connexion offline : "Connecté en mode hors ligne"
- Message lors de la connexion online : "Bienvenue [nom]! 🎉"

## 🧪 Tests

### Test mode ONLINE

1. Connectez-vous avec internet activé
2. Vérifiez que la connexion réussit
3. Vérifiez dans DevTools > Application > IndexedDB > MSPOSAuthDB
4. Vous devriez voir une table `users` avec votre utilisateur

### Test mode OFFLINE

1. Connectez-vous une première fois en mode online
2. Déconnectez-vous
3. Désactivez internet (mode avion ou DevTools > Network > Offline)
4. Reconnectez-vous avec les mêmes identifiants
5. L'authentification doit réussir avec le badge orange "Mode hors ligne"

### Test synchronisation

1. Connectez-vous en mode offline
2. Réactivez internet
3. Observez la console : vous devriez voir "🔄 Connexion rétablie, synchronisation en cours..."
4. Les données sont mises à jour silencieusement

### Test identifiants incorrects offline

1. Assurez-vous d'avoir une session locale (connectez-vous online une fois)
2. Passez en mode offline
3. Essayez de vous connecter avec un mauvais mot de passe
4. L'authentification doit échouer avec un message d'erreur

## 🔧 Configuration

Aucune configuration supplémentaire nécessaire. Le système fonctionne automatiquement.

### Dépendances

- `dexie: ^4.0.11` (déjà installé)
- Angular 21+ (déjà installé)
- API Web native : SubtleCrypto, navigator.onLine, IndexedDB

## 📊 Structure IndexedDB

### Base : MSPOSAuthDB

**Table : users**
```typescript
{
  id: number (auto-increment),
  identifier: string (indexé),
  passwordHash: string,
  token: string,
  userData: any,
  lastSync: Date
}
```

**Note** : Un seul enregistrement à la fois (nettoyage automatique lors de nouvelle connexion)

## 🚨 Gestion des erreurs

### Scénarios gérés

1. **Pas de connexion + Pas de données locales** → Message : "Aucune donnée locale disponible"
2. **Token expiré lors de la sync** → Nettoyage auto + Force reconnexion
3. **Erreur IndexedDB** → Log en console, fallback gracieux
4. **Changement d'utilisateur** → Nettoyage de l'ancien utilisateur local

## 🔐 Logout

Le logout nettoie :
- ✅ localStorage (auth_uuid, auth_id, auth_user)
- ✅ IndexedDB (table users vidée)
- ✅ Appel backend si online

## 📝 Logs console

Le système affiche des logs clairs :
- 📡 `État de connexion: ONLINE/OFFLINE`
- ✅ `Authentification offline réussie`
- ✅ `Utilisateur sauvegardé localement: [identifier]`
- 🔄 `Connexion rétablie, synchronisation en cours...`
- ✅ `Synchronisation réussie`
- ❌ `Échec de l'authentification offline`

## 🎓 Bonnes pratiques

1. **Toujours se connecter online la première fois** pour initialiser les données locales
2. **Ne pas partager d'appareil** : un seul utilisateur par navigateur
3. **Effacer les données du navigateur** si vous changez d'utilisateur définitivement
4. **Vérifier la console** en cas de problème pour les logs détaillés

## 🚀 Déploiement

Aucune étape supplémentaire requise. Le système fonctionne automatiquement après :
```bash
npm start
```

---

**Version** : 1.0  
**Date** : 28 janvier 2026  
**Auteur** : GitHub Copilot
