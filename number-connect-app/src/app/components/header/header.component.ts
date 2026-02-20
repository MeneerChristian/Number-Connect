import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Observable } from 'rxjs';
import { GameStats } from '../../models/game.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="spacer"></div>

      <div class="score-container" *ngIf="stats$ | async as stats">
        <svg
          class="star-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          />
        </svg>
        <span class="score-text">{{ stats.stars }}</span>
      </div>

      <button class="header-button reset-button" aria-label="New Game" (click)="onResetClick()">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
          />
        </svg>
      </button>
    </header>

    <!-- Confirm overlay -->
    <div class="confirm-overlay" *ngIf="showConfirm" (click)="cancelReset()">
      <div class="confirm-card" (click)="$event.stopPropagation()">
        <div class="confirm-title">New Game?</div>
        <div class="confirm-message">Current progress will be lost.</div>
        <div class="confirm-actions">
          <button class="confirm-btn cancel-btn" (click)="cancelReset()">Cancel</button>
          <button class="confirm-btn accept-btn" (click)="confirmReset()">New Game</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        padding: 0 8px;
        background: var(--color-background);
      }

      .header-button {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--color-primary);
        transition: opacity var(--duration-fast);
      }

      .header-button:hover {
        opacity: 0.7;
      }

      .header-button svg {
        width: 24px;
        height: 24px;
      }

      .spacer {
        width: 48px;
      }

      .reset-button {
        color: var(--color-text-secondary);
      }

      .score-container {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--color-surface);
        padding: 6px 16px;
        border-radius: 20px;
        min-width: 72px;
        justify-content: center;
      }

      .star-icon {
        width: 22px;
        height: 22px;
        fill: #ffc107;
      }

      .score-text {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .confirm-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        animation: fade-in 0.15s ease;
      }

      .confirm-card {
        background: var(--color-card-bg);
        border-radius: 16px;
        padding: 24px;
        text-align: center;
        box-shadow: var(--shadow-lg);
        min-width: 260px;
        animation: pop-in 0.2s ease-out;
      }

      .confirm-title {
        font-size: 20px;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 8px;
      }

      .confirm-message {
        font-size: 14px;
        color: var(--color-text-secondary);
        margin-bottom: 20px;
      }

      .confirm-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }

      .confirm-btn {
        padding: 10px 24px;
        border-radius: 20px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all var(--duration-fast);
      }

      .confirm-btn:active {
        transform: scale(0.95);
      }

      .cancel-btn {
        background: var(--color-surface);
        color: var(--color-text-primary);
      }

      .accept-btn {
        background: var(--color-primary);
        color: #fff;
        box-shadow: var(--shadow-primary);
      }

      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes pop-in {
        0% {
          transform: scale(0.9);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  stats$: Observable<GameStats>;
  showConfirm = false;

  constructor(private gameService: GameService) {
    this.stats$ = this.gameService.stats$;
  }

  onResetClick(): void {
    this.showConfirm = true;
  }

  confirmReset(): void {
    this.showConfirm = false;
    this.gameService.newGame();
  }

  cancelReset(): void {
    this.showConfirm = false;
  }
}
