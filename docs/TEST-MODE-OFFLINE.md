# Guide de Test - Mode Offline MSPOS V3

## 🎯 Objectif

Ce guide explique comment tester et utiliser l'application MSPOS V3 en mode hors ligne (offline).

## ⚠️ Prérequis Importants

### 1. Build en Mode Production

**Le Service Worker de PWA ne fonctionne QU'EN MODE PRODUCTION !**

Pour que l'application fonctionne offline, vous DEVEZ :

```bash
# 1. Builder l'application en mode production
npm run build

# 2. Installer un serveur HTTP statique (si pas déjà fait)
npm install -g http-server

# 3. Servir les fichiers buildés
cd dist/mspos-v3/browser
http-server -p 8080 -c-1

# 4. Ouvrir http://localhost:8080 dans votre navigateur
```

### 2. Pourquoi `ng serve` ne fonctionne pas pour l'offline ?

- `ng serve` est en mode **développement**
- Le Service Worker n'est actif qu'en **production** (optimisé pour les performances)
- Les assets ne sont pas préchargés en développement

## 📝 Procédure de Test Complète

### Étape 1 : Première Connexion (ONLINE)

1. **Connectez-vous à Internet**
2. **Buildez et servez l'application** (voir ci-dessus)
3. **Ouvrez** `http://localhost:8080` dans votre navigateur
4. **Connectez-vous** avec vos identifiants :
   - Email ou téléphone
   - Mot de passe

✅ **Ce qui se passe :**
- L'application contacte le backend
- Les identifiants sont validés en ligne
- Le token JWT est récupéré
- **Les données sont sauvegardées dans IndexedDB** :
  - Identifiant (normalisé en lowercase)
  - Hash du mot de passe (SHA-256)
  - Token JWT
  - Données utilisateur complètes
- Le Service Worker met en cache tous les assets

### Étape 2 : Vérification du Cache

Ouvrez les **DevTools** (F12) :

1. **Application** > **Storage** > **IndexedDB** > **msposlocaldb**
   - Table `authUsers` : Vous devez voir votre utilisateur
   - Vérifiez les champs : `identifier`, `passwordHash`, `token`, `userData`

2. **Application** > **Service Workers**
   - Vérifiez que le service worker est **activé** et **en cours d'exécution**
   - Status : "activated and is running"

3. **Application** > **Cache Storage**
   - `ngsw:/:db:control` : Métadonnées du service worker
   - `ngsw:/:...` : Assets mis en cache (CSS, JS, images)

### Étape 3 : Test Mode Offline

1. **Déconnectez-vous** de l'application (bouton logout)

2. **Activez le mode offline** :
   - **DevTools** > **Network** > Cochez "**Offline**"
   - OU désactivez votre Wi-Fi / données mobiles

3. **Actualisez la page** (F5)
   - L'application doit se charger normalement
   - Badge "Mode hors ligne" visible sur la page de login

4. **Connectez-vous** avec les **mêmes identifiants**
   - Identifiant : `test@example.com` (capitalisation ignorée)
   - Mot de passe : votre mot de passe habituel

✅ **Résultat attendu :**
- Message : "Connecté en mode hors ligne"
- Message de bienvenue : "Bienvenue [Nom]! (Mode hors ligne) 📴"
- Redirection vers votre tableau de bord

### Étape 4 : Navigation Offline

Testez la navigation dans l'application :
- ✅ Consulter les POS stockés localement
- ✅ Créer de nouveaux formulaires POS
- ✅ Consulter les plans de tournée
- ✅ Voir les données mises en cache

❌ **Ce qui ne fonctionne PAS hors ligne :**
- Synchronisation avec le backend
- Mise à jour des données serveur
- Téléchargement de nouvelles images
- APIs externes

## 🔧 Dépannage

### Problème : "Vous êtes hors connexion" apparaît même avec Internet

**Solution :**
1. Effacez le cache du navigateur
2. Redémarrez le serveur HTTP
3. Reconnectez-vous en ligne d'abord

### Problème : L'authentification offline échoue

**Causes possibles :**
1. **Vous n'étiez jamais connecté en ligne avant**
   - Solution : Connectez-vous en ligne UNE FOIS d'abord

2. **L'identifiant ne correspond pas**
   - Solution : Utilisez le MÊME identifiant (email/téléphone)
   - Note : La casse est ignorée (`Test@Example.com` = `test@example.com`)

3. **Le mot de passe est incorrect**
   - Solution : Utilisez le bon mot de passe

4. **IndexedDB a été vidée**
   - Solution : Reconnectez-vous en ligne une fois

### Problème : Le Service Worker ne s'active pas

**Solution :**
```bash
# Forcer la reconstruction
rm -rf dist/
npm run build

# Servir avec cache désactivé
http-server dist/mspos-v3/browser -p 8080 -c-1
```

### Problème : Les assets ne se chargent pas

**Vérification :**
1. DevTools > Network : Vérifiez que les fichiers viennent de "(ServiceWorker)"
2. Console : Cherchez les erreurs du Service Worker
3. Si nécessaire, **Unregister** le Service Worker et rechargez

## 🧪 Test Complet Checklist

- [ ] Build en mode production effectué
- [ ] Application servie avec http-server
- [ ] Première connexion ONLINE réussie
- [ ] Données visibles dans IndexedDB
- [ ] Service Worker activé
- [ ] Déconnexion et passage en mode offline
- [ ] Page de login se charge hors ligne
- [ ] Badge "Mode hors ligne" visible
- [ ] Authentification offline réussie
- [ ] Redirection vers le dashboard
- [ ] Navigation dans l'app fonctionnelle
- [ ] Au retour online : synchronisation automatique

## 🔄 Retour en Ligne

Quand vous reconnectez :

1. Le `SyncService` détecte automatiquement le retour de connexion
2. Message console : "🔄 Connexion rétablie, synchronisation en cours..."
3. Les données locales sont synchronisées avec le backend
4. Le token est vérifié et mis à jour si nécessaire

## 📊 Architecture Technique

```
┌─────────────────────────────────────────────────────────┐
│                    MSPOS V3 Offline                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐        ┌──────────────┐             │
│  │   Service    │───────▶│    Cache     │             │
│  │   Worker     │        │   Storage    │             │
│  └──────────────┘        └──────────────┘             │
│         │                                               │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐        ┌──────────────┐             │
│  │   Angular    │───────▶│   IndexedDB  │             │
│  │     App      │        │   (Dexie)    │             │
│  └──────────────┘        └──────────────┘             │
│         │                        │                      │
│         │                        │                      │
│         ▼                        ▼                      │
│  ┌──────────────────────────────────────┐             │
│  │         NetworkService                │             │
│  │    (Détection Online/Offline)         │             │
│  └──────────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🎓 Bonnes Pratiques

1. **Toujours se connecter online la première fois**
2. **Ne pas effacer le cache du navigateur** (sauf pour debug)
3. **Utiliser le même identifiant** (casse ignorée)
4. **Tester régulièrement en mode production**
5. **Vérifier IndexedDB après chaque connexion online**

## 📞 Support

En cas de problème :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs détaillés avec emoji (✅, ❌, 🔄, etc.)
3. Consultez la documentation :
   - `docs/AUTHENTIFICATION-OFFLINE.md`
   - `docs/OFFLINE-ONLINE-QUEUE-SYSTEM.md`

---

**Version** : 3.2.0  
**Dernière mise à jour** : 19 février 2026
