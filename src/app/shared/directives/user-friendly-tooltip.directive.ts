import { Directive, ElementRef, Input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appUserFriendlyTooltip]',
  standalone: true
})
export class UserFriendlyTooltipDirective implements OnInit, OnDestroy {
  @Input('appUserFriendlyTooltip') tooltipText: string = '';
  @Input() placement: string = 'top';
  @Input() autoInit: boolean = true;

  private tooltipInstance: any;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    if (this.autoInit && this.tooltipText) {
      this.initTooltip();
    }
  }

  ngOnDestroy() {
    if (this.tooltipInstance) {
      this.tooltipInstance.dispose();
    }
  }

  private initTooltip() {
    // Ajouter les attributs Bootstrap pour les tooltips
    this.renderer.setAttribute(this.el.nativeElement, 'data-bs-toggle', 'tooltip');
    this.renderer.setAttribute(this.el.nativeElement, 'data-bs-placement', this.placement);
    this.renderer.setAttribute(this.el.nativeElement, 'title', this.tooltipText);
    
    // Ajouter des classes pour améliorer l'apparence
    this.renderer.addClass(this.el.nativeElement, 'user-friendly-tooltip');
    
    // Initialiser le tooltip Bootstrap si disponible
    if (typeof (window as any).bootstrap !== 'undefined') {
      this.tooltipInstance = new (window as any).bootstrap.Tooltip(this.el.nativeElement, {
        placement: this.placement,
        title: this.tooltipText,
        trigger: 'hover focus'
      });
    }
  }
}
