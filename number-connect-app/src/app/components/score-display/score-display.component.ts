import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Subscription } from 'rxjs';
import { GameStats } from '../../models/game.models';

@Component({
  selector: 'app-score-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-display">
      <div class="score-number">{{ displayScore }}</div>
    </div>
  `,
  styles: [`
    .score-display {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background);
    }

    .score-number {
      font-size: 40px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.5px;
      color: var(--color-text-primary);
      font-family: 'Roboto', sans-serif;
      transition: transform var(--duration-medium) ease-out;
    }

    .score-number.animate {
      animation: score-pulse 0.4s ease-out;
    }

    @keyframes score-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `]
})
export class ScoreDisplayComponent implements OnInit, OnDestroy {
  displayScore = 0;
  private targetScore = 0;
  private animationFrame?: number;
  private subscription?: Subscription;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.gameService.stats$.subscribe((stats: GameStats) => {
      this.animateScore(stats.currentScore);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private animateScore(newScore: number): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.targetScore = newScore;
    const startScore = this.displayScore;
    const difference = this.targetScore - startScore;
    const duration = 400;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.displayScore = Math.round(startScore + (difference * easeOut));
      this.cdr.detectChanges();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.displayScore = this.targetScore;
        this.cdr.detectChanges();
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }
}
