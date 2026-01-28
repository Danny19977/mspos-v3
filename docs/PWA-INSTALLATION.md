# Installation PWA - MSPOS V3

## Vue d'ensemble

Cette fonctionnalité permet aux utilisateurs d'installer MSPOS V3 en tant qu'application Progressive Web App (PWA) sur leur appareil. L'application détecte automatiquement la plateforme de l'utilisateur et affiche un dialog d'installation adapté avec des instructions spécifiques pour chaque plateforme.

## Plateformes supportées

### ✅ Windows
- **Navigateurs supportés**: Chrome, Edge
- **Installation automatique**: Oui (via l'API beforeinstallprompt)
- **Fonctionnalité**: L'application apparaît dans le menu Démarrer et peut être lancée comme une application native

### ✅ macOS
- **Navigateurs supportés**: Chrome, Edge
- **Installation automatique**: Oui (via l'API beforeinstallprompt)
- **Fonctionnalité**: L'application apparaît dans le Dock et Applications

### ✅ Android
- **Navigateurs supportés**: Chrome, Edge, Samsung Internet
- **Installation automatique**: Oui (via l'API beforeinstallprompt)
- **Fonctionnalité**: L'application apparaît sur l'écran d'accueil et dans le tiroir d'applications

### ✅ iOS/iPadOS
- **Navigateurs supportés**: Safari
- **Installation automatique**: Non (limitations d'Apple)
- **Fonctionnalité**: Instructions manuelles pour ajouter à l'écran d'accueil via le menu Partage

## Fonctionnement

### 1. Détection automatique
Le service `PwaInstallService` détecte automatiquement :
- La plateforme de l'utilisateur (Windows, Mac, iOS, Android)
- Le navigateur utilisé
- Si l'application est déjà installée (mode standalone)
- Si l'installation est possible

### 2. Affichage du dialog
Le dialog s'affiche automatiquement :
- **Quand**: 3 secondes après le chargement complet de l'application
- **Condition**: Uniquement si l'utilisateur n'a pas :
  - Déjà installé l'application
  - Fermé le dialog dans les 7 derniers jours
  - Déjà l'application en mode standalone

### 3. Installation
Deux modes d'installation :

#### Installation automatique (Chrome/Edge)
1. L'utilisateur clique sur "Installer maintenant"
2. Le navigateur affiche son propre prompt d'installation natif
3. L'utilisateur confirme l'installation
4. L'application est installée

#### Installation manuelle (iOS Safari)
1. Le dialog affiche des instructions étape par étape
2. L'utilisateur suit les instructions manuellement
3. L'utilisateur appuie sur "Compris" pour fermer le dialog

## Architecture des fichiers

```
src/app/
├── core/services/
│   └── pwa-install.service.ts          # Service principal de gestion PWA
├── shared/pwa-install-dialog/
│   ├── pwa-install-dialog.component.ts  # Composant du dialog
│   ├── pwa-install-dialog.component.html # Template du dialog
│   └── pwa-install-dialog.component.scss # Styles du dialog
└── app.component.ts                     # Intégration dans l'app principale

public/
└── manifest.webmanifest                 # Manifest PWA optimisé
```

## Service: PwaInstallService

### Méthodes principales

```typescript
// Obtenir les informations de plateforme
getPlatformInfo(): Observable<PlatformInfo>

// Vérifier si l'installation est possible
getCanInstall(): Observable<boolean>

// Déclencher l'installation PWA
installPwa(): Promise<{ success: boolean; userChoice?: string }>

// Obtenir les instructions d'installation
getInstallInstructions(): string[]

// Vérifier si le dialog doit être affiché
shouldShowInstallPrompt(): boolean

// Marquer le dialog comme fermé
dismissInstallPrompt(): void

// Marquer l'application comme installée
markAsInstalled(): void
```

### Interface PlatformInfo

```typescript
interface PlatformInfo {
  name: 'windows' | 'mac' | 'ios' | 'android' | 'other';
  isStandalone: boolean;
  canInstall: boolean;
  browserName: string;
}
```

## Composant: PwaInstallDialogComponent

### Fonctionnalités

- **Détection de plateforme**: Affiche l'icône et le nom de la plateforme
- **Liste des avantages**: Montre pourquoi installer l'application
- **Instructions adaptées**: Instructions spécifiques selon la plateforme
- **Boutons contextuels**: "Installer maintenant" ou "Compris" selon la plateforme
- **Design responsive**: S'adapte aux petits écrans

## Manifest PWA

Le fichier `manifest.webmanifest` contient :

```json
{
  "name": "MSPOS V3 - Système de Gestion",
  "short_name": "MSPOS V3",
  "description": "Application de gestion complète",
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "any",
  "scope": "./",
  "start_url": "./",
  "icons": [...],
  "shortcuts": [...]
}
```

## Gestion du stockage local

Le service utilise `localStorage` pour mémoriser les préférences de l'utilisateur :

- `pwa-install-dismissed`: Timestamp de la dernière fermeture du dialog (réaffichage après 7 jours)
- `pwa-installed`: Indique si l'utilisateur a déjà installé l'application

## Personnalisation

### Modifier le délai d'affichage

Dans `app.component.ts` :

```typescript
setTimeout(() => {
  this.openInstallDialog(platformInfo);
}, 3000); // Modifier cette valeur (en millisecondes)
```

### Modifier la période de réaffichage

Dans `pwa-install.service.ts` :

```typescript
const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
if (daysSinceDismissed < 7) { // Modifier cette valeur (en jours)
  return false;
}
```

### Personnaliser les couleurs

Dans `pwa-install-dialog.component.scss`, modifier les variables de couleur :

```scss
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## Avantages de l'installation

L'application PWA installée offre :

1. **Lancement rapide**: Icône sur l'écran d'accueil/bureau
2. **Hors ligne**: Fonctionne sans connexion internet
3. **Notifications**: Notifications push en temps réel
4. **Plein écran**: Expérience sans barre d'adresse
5. **Performance**: Mise en cache pour un chargement plus rapide
6. **Intégration OS**: Apparaît dans la liste des applications installées

## Tests

Pour tester la fonctionnalité :

1. **Mode développement**: Le service worker est désactivé par défaut
2. **Mode production**: 
   ```bash
   npm run build
   # Servir les fichiers dist/ avec un serveur HTTP
   ```
3. **Simuler différentes plateformes**: Utiliser les DevTools du navigateur
4. **Test iOS**: Tester sur un véritable appareil iOS avec Safari

## Dépannage

### Le dialog ne s'affiche pas

- Vérifier que l'application n'est pas déjà en mode standalone
- Vérifier le localStorage (peut-être déjà fermé récemment)
- Vérifier la console pour les logs de debug
- S'assurer d'utiliser un navigateur compatible

### L'installation échoue

- Vérifier que le manifest.webmanifest est correctement servi
- Vérifier que toutes les icônes existent
- Vérifier que le service worker est enregistré
- Consulter les DevTools > Application > Manifest

### iOS ne propose pas l'installation automatique

C'est normal ! iOS ne supporte pas l'API `beforeinstallprompt`. Le dialog affiche des instructions manuelles à la place.

## Compatibilité navigateur

| Plateforme | Chrome | Edge | Safari | Firefox |
|------------|--------|------|--------|---------|
| Windows    | ✅     | ✅   | ❌     | ❌      |
| macOS      | ✅     | ✅   | ⚠️     | ❌      |
| Android    | ✅     | ✅   | N/A    | ❌      |
| iOS        | N/A    | N/A  | ⚠️     | N/A     |

✅ Installation automatique supportée  
⚠️ Installation manuelle uniquement  
❌ Non supporté

## Ressources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: Install prompt](https://web.dev/customize-install/)
- [Apple: Web App Manifest](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
