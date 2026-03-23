import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';

@Directive({
  selector: '[appRipple]',
  standalone: true,
})
export class RippleDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private prefersReducedMotion = false;
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  @HostBinding('style.position') hostPosition = 'relative';
  @HostBinding('style.overflow') hostOverflow = 'hidden';

  ngOnInit(): void {
    this.mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
    this.prefersReducedMotion = this.mediaQuery?.matches ?? false;
    this.mediaQueryHandler = (e: MediaQueryListEvent) => {
      this.prefersReducedMotion = e.matches;
    };
    this.mediaQuery?.addEventListener('change', this.mediaQueryHandler);
  }

  ngOnDestroy(): void {
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery?.removeEventListener('change', this.mediaQueryHandler);
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.createRipple(event.clientX, event.clientY);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    if (touch) {
      this.createRipple(touch.clientX, touch.clientY);
    }
  }

  private createRipple(clientX: number, clientY: number): void {
    if (this.prefersReducedMotion) {
      return;
    }

    const host: HTMLElement = this.el.nativeElement;
    const rect = host.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const maxDist = Math.max(
      Math.hypot(x, y),
      Math.hypot(rect.width - x, y),
      Math.hypot(x, rect.height - y),
      Math.hypot(rect.width - x, rect.height - y)
    );
    const diameter = maxDist * 2;

    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${x - maxDist}px`;
    ripple.style.top = `${y - maxDist}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(33, 150, 243, 0.2)';
    ripple.style.transform = 'scale(0)';
    ripple.style.opacity = '1';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'appRippleExpand 300ms ease-out forwards';

    this.ensureKeyframes();

    host.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 300);
  }

  private keyframesInjected = false;

  private ensureKeyframes(): void {
    if (this.keyframesInjected) {
      return;
    }
    const styleId = 'app-ripple-keyframes';
    if (document.getElementById(styleId)) {
      this.keyframesInjected = true;
      return;
    }
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes appRippleExpand {
        0% {
          transform: scale(0);
          opacity: 1;
        }
        100% {
          transform: scale(1);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    this.keyframesInjected = true;
  }
}
