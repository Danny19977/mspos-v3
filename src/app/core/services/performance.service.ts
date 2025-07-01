import { Injectable } from '@angular/core';

export interface PerformanceMetrics {
  startTime: number;
  domContentLoaded: number;
  appBootstrap: number;
  firstMeaningfulPaint: number;
  totalLoadTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {
  private metrics: Partial<PerformanceMetrics> = {};
  private startTime: number;

  constructor() {
    this.startTime = performance.now();
    this.metrics.startTime = this.startTime;
    this.setupPerformanceObserver();
  }

  /**
   * Marquer le moment où l'application Angular est bootstrappée
   */
  markAppBootstrap(): void {
    this.metrics.appBootstrap = performance.now();
    console.log(`🚀 App Bootstrap: ${Math.round(this.metrics.appBootstrap - this.startTime)}ms`);
  }

  /**
   * Marquer le moment où le DOM est complètement chargé
   */
  markDomReady(): void {
    this.metrics.domContentLoaded = performance.now();
    console.log(`📄 DOM Ready: ${Math.round(this.metrics.domContentLoaded - this.startTime)}ms`);
  }

  /**
   * Marquer le temps total de chargement
   */
  markLoadComplete(): void {
    this.metrics.totalLoadTime = performance.now();
    console.log(`✅ Load Complete: ${Math.round(this.metrics.totalLoadTime - this.startTime)}ms`);
    this.logPerformanceReport();
  }

  /**
   * Obtenir les métriques de performance
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Configuration de l'observateur de performance
   */
  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      // Observer pour les métriques de peinture
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstMeaningfulPaint = entry.startTime;
            console.log(`🎨 First Contentful Paint: ${Math.round(entry.startTime)}ms`);
          }
        }
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.log('Paint observer not supported');
      }

      // Observer pour les métriques de navigation
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.group('📊 Navigation Timing');
            console.log(`DNS Lookup: ${Math.round(navEntry.domainLookupEnd - navEntry.domainLookupStart)}ms`);
            console.log(`TCP Connection: ${Math.round(navEntry.connectEnd - navEntry.connectStart)}ms`);
            console.log(`Request: ${Math.round(navEntry.responseStart - navEntry.requestStart)}ms`);
            console.log(`Response: ${Math.round(navEntry.responseEnd - navEntry.responseStart)}ms`);
            console.log(`DOM Processing: ${Math.round(navEntry.domComplete - navEntry.domInteractive)}ms`);
            console.groupEnd();
          }
        }
      });

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.log('Navigation observer not supported');
      }
    }
  }

  /**
   * Générer un rapport de performance détaillé
   */
  private logPerformanceReport(): void {
    const metrics = this.getMetrics();
    
    console.group('📈 RAPPORT DE PERFORMANCE MSPOS V3');
    console.log('================================');
    
    if (metrics.domContentLoaded && metrics.startTime) {
      console.log(`⏱️  Temps DOM: ${Math.round(metrics.domContentLoaded - metrics.startTime)}ms`);
    }
    
    if (metrics.appBootstrap && metrics.startTime) {
      console.log(`🚀 Temps Bootstrap: ${Math.round(metrics.appBootstrap - metrics.startTime)}ms`);
    }
    
    if (metrics.firstMeaningfulPaint) {
      console.log(`🎨 First Paint: ${Math.round(metrics.firstMeaningfulPaint)}ms`);
    }
    
    if (metrics.totalLoadTime && metrics.startTime) {
      console.log(`✅ Temps Total: ${Math.round(metrics.totalLoadTime - metrics.startTime)}ms`);
    }

    // Recommandations basées sur les métriques
    this.provideRecommendations(metrics);
    
    console.log('================================');
    console.groupEnd();
  }

  /**
   * Fournir des recommandations basées sur les performances
   */
  private provideRecommendations(metrics: Partial<PerformanceMetrics>): void {
    const recommendations: string[] = [];
    
    if (metrics.totalLoadTime && metrics.startTime) {
      const totalTime = metrics.totalLoadTime - metrics.startTime;
      
      if (totalTime > 3000) {
        recommendations.push('⚠️  Temps de chargement élevé (>3s)');
        recommendations.push('💡 Considérer le lazy loading et la optimisation des bundles');
      } else if (totalTime > 1500) {
        recommendations.push('⚡ Temps de chargement acceptable mais peut être amélioré');
        recommendations.push('💡 Optimiser les images et les polices');
      } else {
        recommendations.push('✅ Excellent temps de chargement!');
      }
    }

    if (metrics.firstMeaningfulPaint && metrics.firstMeaningfulPaint > 1500) {
      recommendations.push('🎨 First Paint tardif - optimiser le CSS critique');
    }

    if (recommendations.length > 0) {
      console.log('🔧 RECOMMANDATIONS:');
      recommendations.forEach(rec => console.log(rec));
    }
  }

  /**
   * Marquer un événement personnalisé
   */
  mark(name: string): void {
    const time = performance.now();
    console.log(`🏷️  ${name}: ${Math.round(time - this.startTime)}ms`);
    
    if (performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Mesurer le temps entre deux marqueurs
   */
  measure(name: string, startMark: string, endMark?: string): void {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measures = performance.getEntriesByName(name, 'measure');
        if (measures.length > 0) {
          const measure = measures[measures.length - 1];
          console.log(`📏 ${name}: ${Math.round(measure.duration)}ms`);
        }
      } catch (e) {
        console.warn(`Cannot measure ${name}:`, e);
      }
    }
  }
}
