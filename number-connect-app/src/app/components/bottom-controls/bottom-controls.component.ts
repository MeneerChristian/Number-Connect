import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Observable } from 'rxjs';
import { GameStats } from '../../models/game.models';

@Component({
  selector: 'app-bottom-controls',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bottom-controls" *ngIf="stats$ | async as stats">
      <button
        class="control-button add-button"
        (click)="onAddClick()"
        [disabled]="stats.addsRemaining <= 0"
        aria-label="Add numbers"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        <span class="badge add-badge" *ngIf="stats.addsRemaining > 0">{{
          stats.addsRemaining
        }}</span>
      </button>

      <button
        class="control-button hint-button"
        (click)="onHintClick()"
        [disabled]="stats.stars < stats.hintCost"
        aria-label="Get hint"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"
          />
        </svg>
        <span class="badge hint-badge">
          <svg class="badge-star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          {{ stats.hintCost }}
        </span>
      </button>
    </div>
  `,
  styles: [
    `
      .bottom-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 48px;
        height: 80px;
        padding: 12px 24px;
        padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
        background: var(--color-background);
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 5;
      }

      .control-button {
        position: relative;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all var(--duration-fast);
      }

      .control-button:hover:not(:disabled) {
        transform: scale(0.95);
      }

      .control-button:active:not(:disabled) {
        transform: scale(0.9);
      }

      .control-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .control-button svg {
        width: 28px;
        height: 28px;
      }

      .add-button {
        background: var(--color-btn-add-bg);
        color: var(--color-primary);
        box-shadow: var(--shadow-primary);
      }

      .add-button:disabled {
        background: var(--color-btn-disabled-bg);
        color: var(--color-btn-disabled-color);
      }

      .hint-button {
        background: var(--color-surface);
        color: var(--color-primary);
        box-shadow: var(--shadow-sm);
      }

      .hint-button:disabled {
        background: var(--color-btn-disabled-bg);
        color: var(--color-btn-disabled-color);
      }

      .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 22px;
        height: 22px;
        border-radius: 11px;
        color: white;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        border: 2px solid var(--color-background);
      }

      .add-badge {
        background: var(--color-primary);
      }

      .hint-badge {
        background: #ffa000;
        gap: 1px;
      }

      .badge-star {
        width: 10px;
        height: 10px;
        fill: white;
      }
    `,
  ],
})
export class BottomControlsComponent {
  stats$: Observable<GameStats>;

  constructor(private gameService: GameService) {
    this.stats$ = this.gameService.stats$;
  }

  onAddClick(): void {
    this.gameService.addNumbers();
  }

  onHintClick(): void {
    this.gameService.getHint();
  }
}
