# 🚀 Guide de Démarrage Rapide - Mode Offline

## ⚡ Test Rapide du Mode Offline

### Option 1 : Commande Tout-en-Un (Recommandé)

```bash
npm run test:offline
```

Cette commande :
1. ✅ Build l'application en mode production
2. ✅ Démarre un serveur HTTP
3. ✅ Ouvre automatiquement votre navigateur sur `http://localhost:8080`

### Option 2 : Build puis Servir (Méthode manuelle)

```bash
# 1. Builder l'application
npm run build

# 2. Servir les fichiers buildés
npm run serve:prod
```

## 📋 Étapes de Test

1. **Première connexion (ONLINE)**
   ```
   - Ouvrez http://localhost:8080
   - Connectez-vous avec vos identifiants
   - Vérifiez que vous êtes bien connecté
   ```

2. **Test mode offline**
   ```
   - Déconnectez-vous (logout)
   - DevTools (F12) > Network > Cochez "Offline"
   - Actualisez la page (F5)
   - Connectez-vous avec les mêmes identifiants
   - ✅ Vous devez voir "Connecté en mode hors ligne"
   ```

## 🔍 Vérifications

### Dans IndexedDB (DevTools > Application > IndexedDB > msposlocaldb)

Vous devez voir :
- **Table `authUsers`** : Votre utilisateur avec :
  - `identifier` : votre email/téléphone en lowercase
  - `passwordHash` : hash SHA-256 de votre mot de passe  
  - `token` : votre token JWT
  - `userData` : vos informations complètes

### Dans Service Workers (DevTools > Application > Service Workers)

Vous devez voir :
- **Status** : "activated and is running"
- **Source** : ngsw-worker.js

## ❌ Erreurs Courantes

### "Identifiants incorrects" en mode offline

**Cause** : Vous n'étiez jamais connecté en ligne avant  
**Solution** : Connectez-vous EN LIGNE une première fois

### L'application ne se charge pas offline

**Cause** : Vous utilisez `ng serve` (mode développement)  
**Solution** : Utilisez `npm run test:offline` (mode production)

### Le Service Worker n'apparaît pas

**Cause** : Le build n'est pas en mode production  
**Solution** : 
```bash
rm -rf dist/
npm run build
npm run serve:prod
```

## 📞 Besoin d'Aide ?

Consultez la documentation détaillée :
- **Guide complet** : `docs/TEST-MODE-OFFLINE.md`
- **Architecture offline** : `docs/AUTHENTIFICATION-OFFLINE.md`

## 🎯 Commandes Utiles

```bash
# Développement normal (PAS de Service Worker)
npm start

# Build + Test Offline
npm run test:offline

# Build seulement
npm run build

# Servir un build existant
npm run serve:prod

# Analyse du bundle
npm run build:analyze
```

---

✅ **L'application est maintenant prête pour le mode offline !**
