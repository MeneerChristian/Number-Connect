import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Observable } from 'rxjs';
import { GameStats } from '../../models/game.models';

@Component({
  selector: 'app-stats-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-bar" *ngIf="stats$ | async as stats">
      <div class="stage-section">
        <div class="stage-label">Stage</div>
        <div class="stage-number">{{ stats.stage }}</div>
      </div>

      <div class="numbers-cleared-section">
        <div class="numbers-cleared-label">Numbers Cleared</div>
        <div class="numbers-tracker">
          <span
            *ngFor="let num of numbers"
            class="number-item"
            [class.cleared]="isNumberCleared(num, stats.numbersCleared)"
          >
            <span *ngIf="!isNumberCleared(num, stats.numbersCleared)">{{ num }}</span>
            <svg
              *ngIf="isNumberCleared(num, stats.numbersCleared)"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="check-icon"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </span>
        </div>
      </div>

      <div class="score-section">
        <div class="score-label">Top Score</div>
        <div class="score-value">
          <svg
            class="trophy-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
            />
          </svg>
          {{ stats.topScore }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .stats-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 72px;
        padding: 12px 16px;
        background: var(--color-background);
        border-bottom: 1px solid var(--color-border);
      }

      .stage-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .stage-label {
        font-size: 11px;
        color: var(--color-text-secondary);
      }

      .stage-number {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .numbers-cleared-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        flex: 1;
        padding: 0 12px;
      }

      .numbers-cleared-label {
        font-size: 11px;
        color: var(--color-text-secondary);
      }

      .numbers-tracker {
        display: flex;
        gap: 2px;
      }

      .number-item {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary);
        transition: all var(--duration-medium);
      }

      .number-item.cleared {
        color: var(--color-text-secondary);
      }

      .check-icon {
        width: 16px;
        height: 16px;
        fill: var(--color-text-secondary);
      }

      .score-section {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      .score-label {
        font-size: 11px;
        color: var(--color-text-secondary);
      }

      .score-value {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .trophy-icon {
        width: 16px;
        height: 16px;
        fill: #ffc107;
      }
    `,
  ],
})
export class StatsBarComponent {
  stats$: Observable<GameStats>;
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor(private gameService: GameService) {
    this.stats$ = this.gameService.stats$;
  }

  isNumberCleared(num: number, numbersCleared: { [key: number]: number }): boolean {
    return (numbersCleared[num] || 0) > 0;
  }
}
