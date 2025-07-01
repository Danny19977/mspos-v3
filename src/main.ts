import { platformBrowser } from '@angular/platform-browser';
import { AppModule } from './app/app.module';

// Optimisations pour le démarrage
const startTime = performance.now();

platformBrowser().bootstrapModule(AppModule, {
  ngZoneEventCoalescing: true,
  ngZoneRunCoalescing: true,
  preserveWhitespaces: false,
})
  .then(() => {
    const loadTime = performance.now() - startTime;
    console.log(`✅ Application démarrée en ${Math.round(loadTime)}ms`);
    
    // Masquer le splash screen avec animation
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.classList.add('fade-out');
      setTimeout(() => {
        splashScreen.remove();
      }, 500);
    }
  })
  .catch(err => {
    console.error('❌ Erreur lors du démarrage:', err);
    
    // Masquer le splash screen même en cas d'erreur
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      splashScreen.innerHTML = `
        <div class="splash-content">
          <div class="error-message">
            <h3>Erreur de démarrage</h3>
            <p>Veuillez recharger la page</p>
            <button onclick="window.location.reload()" class="retry-btn">Recharger</button>
          </div>
        </div>
      `;
    }
  });
