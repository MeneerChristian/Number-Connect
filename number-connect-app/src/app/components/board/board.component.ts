import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { GameState, Point, Cell, MatchEvent, Path } from '../../models/game.models';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="board-container" *ngIf="gameState$ | async as state">
      <div class="grid-wrapper" #gridWrapper>
        <div
          class="grid"
          #gridEl
          [style.grid-template-columns]="'repeat(' + state.columns + ', 1fr)'"
        >
          <ng-container *ngFor="let row of state.grid; let rIdx = index">
            <div
              *ngFor="let cell of row; let cIdx = index"
              [id]="getCellId(rIdx, cIdx)"
              class="cell"
              [class.occupied]="cell.isOccupied"
              [class.cleared]="!cell.isOccupied && cell.wasEverOccupied"
              [class.selected]="isSelected(rIdx, cIdx)"
              [class.hint]="isHint(rIdx, cIdx)"
              [class.animating]="isAnimating(rIdx, cIdx)"
              [class.failed-match]="isFailedMatch(rIdx, cIdx)"
              [class.new-number]="isNewNumber(rIdx, cIdx)"
              (click)="onCellClick(cell)"
            >
              <span *ngIf="cell.isOccupied && cell.value !== null" class="cell-value">{{
                cell.value
              }}</span>
              <span
                *ngIf="!cell.isOccupied && cell.wasEverOccupied && cell.value !== null"
                class="cell-value ghost"
                >{{ cell.value }}</span
              >
            </div>
          </ng-container>
        </div>

        <!-- SVG overlay for match path line -->
        <svg
          *ngIf="matchPath && matchPath.length >= 2"
          class="path-overlay"
          [attr.viewBox]="getViewBox(state)"
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.03" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <polyline
            [attr.points]="getPolylinePoints(matchPath)"
            class="match-line"
            fill="none"
            stroke="var(--color-primary)"
            [attr.stroke-width]="0.06"
            stroke-opacity="0.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#glow)"
          />
        </svg>
      </div>

      <!-- Stage Complete overlay -->
      <div class="game-over-overlay" *ngIf="state.isGameOver">
        <div class="game-over-card">
          <div class="game-over-title">Stage Complete!</div>
          <div class="game-over-score">Score: {{ state.score }}</div>
        </div>
      </div>

      <!-- No Moves Left overlay -->
      <div class="game-over-overlay" *ngIf="state.noMovesLeft && !state.isGameOver">
        <div class="game-over-card">
          <div class="no-moves-title">No Moves Left</div>
          <div class="game-over-score">Score: {{ state.score }}</div>
          <button class="new-game-button" (click)="onNewGame()">New Game</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .board-container {
        padding: 8px 16px;
        padding-bottom: 88px;
        background: var(--color-background);
        display: flex;
        justify-content: center;
        position: relative;
      }

      .grid-wrapper {
        position: relative;
        width: 100%;
        max-width: 450px;
      }

      .grid {
        display: grid;
        gap: 2px;
        background: var(--color-border);
        padding: 2px;
        border-radius: var(--radius-sm);
      }

      .cell {
        aspect-ratio: 1;
        background: var(--color-background);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        transition: all var(--duration-medium) ease;
        position: relative;
        min-height: 32px;
      }

      .cell-value {
        font-size: clamp(20px, 8vw, 32px);
        font-weight: 500;
        font-family: var(--font-primary);
        line-height: 1;
      }

      .cell-value.ghost {
        color: var(--color-text-cleared);
        font-weight: 400;
        opacity: 0.35;
      }

      .cell.occupied {
        background: var(--color-background);
      }

      .cell.occupied .cell-value {
        color: var(--color-text-primary);
      }

      .cell.cleared {
        background: var(--color-cleared-bg);
      }

      .cell.selected {
        background: var(--color-selected-bg) !important;
        border: 2px solid var(--color-selected-border);
        transform: scale(1.05);
        box-shadow: 0 2px 8px var(--color-selected-shadow);
        z-index: 3;
      }

      .cell.selected .cell-value {
        color: var(--color-primary);
        font-weight: 600;
      }

      .cell.hint {
        background: rgba(255, 235, 59, 0.3) !important;
        border: 2px dashed var(--color-warning);
        animation: hint-pulse 2s ease-in-out infinite;
      }

      .cell.animating {
        animation: match-success 0.5s ease-out forwards;
        z-index: 3;
      }

      .cell.failed-match {
        animation: shake 0.4s ease;
      }

      .cell.new-number {
        animation: pop-in 0.3s ease-out;
      }

      .path-overlay {
        position: absolute;
        top: 2px;
        left: 2px;
        width: calc(100% - 4px);
        height: calc(100% - 4px);
        pointer-events: none;
        z-index: 10;
      }

      .match-line {
        stroke-dasharray: 10;
        stroke-dashoffset: 10;
        animation: draw-line 0.3s ease-out forwards;
      }

      /* Game Over */
      .game-over-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-overlay-bg);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        animation: fade-in 0.3s ease;
      }

      .game-over-card {
        background: var(--color-card-bg);
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        box-shadow: var(--shadow-lg);
        animation: pop-in 0.4s ease-out;
      }

      .game-over-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--color-success);
        margin-bottom: 8px;
      }

      .no-moves-title {
        font-size: 28px;
        font-weight: 700;
        color: var(--color-error);
        margin-bottom: 8px;
      }

      .game-over-score {
        font-size: 20px;
        font-weight: 600;
        color: var(--color-text-primary);
        margin-bottom: 24px;
      }

      .new-game-button {
        background: var(--color-primary);
        color: #fff;
        border: none;
        padding: 12px 32px;
        border-radius: 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: var(--shadow-primary);
        transition: all var(--duration-fast);
      }

      .new-game-button:hover {
        transform: scale(0.95);
      }

      .new-game-button:active {
        transform: scale(0.9);
      }

      /* Animations */
      @keyframes fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes draw-line {
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes hint-pulse {
        0%,
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 rgba(255, 193, 7, 0.5);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
        }
      }

      @keyframes match-success {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
        100% {
          transform: scale(0.8);
          opacity: 0;
        }
      }

      @keyframes shake {
        0%,
        100% {
          transform: translateX(0);
        }
        25% {
          transform: translateX(-8px);
        }
        75% {
          transform: translateX(8px);
        }
      }

      @keyframes pop-in {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 360px) {
        .cell-value {
          font-size: clamp(18px, 7vw, 28px);
        }
      }

      @media (min-width: 414px) {
        .cell-value {
          font-size: clamp(24px, 8vw, 36px);
        }
      }
    `,
  ],
})
export class BoardComponent implements OnInit, OnDestroy {
  @ViewChild('gridWrapper') gridWrapper!: ElementRef;
  @ViewChild('gridEl') gridEl!: ElementRef;

  gameState$: Observable<GameState>;
  selectedCell: Point | null = null;
  hintCells: Point[] | null = null;

  matchPath: Path | null = null;
  animatingCells: Set<string> = new Set();
  failedMatchCells: Point[] | null = null;
  newNumberCells: Set<string> = new Set();

  private readonly cellUnit = 1;
  private readonly gapUnit = 0.048;

  private subscriptions: Subscription[] = [];
  private matchPathTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private gameService: GameService,
    private cdr: ChangeDetectorRef
  ) {
    this.gameState$ = this.gameService.gameState$;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.gameService.matchEvent$.subscribe((event) => {
        this.handleMatchEvent(event);
      })
    );

    this.subscriptions.push(
      this.gameService.animationEvent$.subscribe((event) => {
        this.handleAnimationEvent(event);
      })
    );

    this.subscriptions.push(
      this.gameService.hint$.subscribe((hint) => {
        this.hintCells = hint;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.hintCells = null;
          this.cdr.detectChanges();
        }, 3000);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.matchPathTimeout) {
      clearTimeout(this.matchPathTimeout);
    }
  }

  private handleMatchEvent(event: MatchEvent): void {
    // Cancel any pending cleanup from a previous match
    if (this.matchPathTimeout) {
      clearTimeout(this.matchPathTimeout);
      this.matchPathTimeout = null;
    }

    // Clear all previous animation state before starting new match
    this.animatingCells.clear();
    this.matchPath = event.path;

    event.points.forEach((p) => {
      this.animatingCells.add(`${p.row}-${p.col}`);
    });
    this.cdr.detectChanges();

    this.matchPathTimeout = setTimeout(() => {
      this.matchPath = null;
      this.matchPathTimeout = null;
      this.animatingCells.clear();
      this.cdr.detectChanges();
    }, 800);
  }

  private handleAnimationEvent(event: any): void {
    switch (event.type) {
      case 'failed-match':
        this.failedMatchCells = event.data.points;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.failedMatchCells = null;
          this.cdr.detectChanges();
        }, 400);
        break;

      case 'add-numbers':
        event.data.positions.forEach((p: Point, index: number) => {
          setTimeout(() => {
            this.newNumberCells.add(`${p.row}-${p.col}`);
            this.cdr.detectChanges();
            setTimeout(() => {
              this.newNumberCells.delete(`${p.row}-${p.col}`);
              this.cdr.detectChanges();
            }, 300);
          }, index * 50);
        });
        break;
    }
  }

  onCellClick(cell: Cell) {
    if (!cell.isOccupied) return;

    // Clear any lingering match effects
    if (this.matchPath || this.animatingCells.size > 0) {
      this.matchPath = null;
      this.animatingCells.clear();
      if (this.matchPathTimeout) {
        clearTimeout(this.matchPathTimeout);
        this.matchPathTimeout = null;
      }
    }

    // Clear hint when user taps
    this.hintCells = null;

    if (this.selectedCell) {
      if (this.selectedCell.row === cell.row && this.selectedCell.col === cell.col) {
        this.selectedCell = null;
      } else {
        const success = this.gameService.tryMatch(this.selectedCell, {
          row: cell.row,
          col: cell.col,
        });
        if (success) {
          this.selectedCell = null;
        } else {
          this.selectedCell = { row: cell.row, col: cell.col };
        }
      }
    } else {
      this.selectedCell = { row: cell.row, col: cell.col };
    }
  }

  onNewGame(): void {
    this.selectedCell = null;
    this.hintCells = null;
    this.matchPath = null;
    this.animatingCells.clear();
    this.failedMatchCells = null;
    this.newNumberCells.clear();
    this.gameService.newGame();
  }

  isSelected(r: number, c: number): boolean {
    return !!this.selectedCell && this.selectedCell.row === r && this.selectedCell.col === c;
  }

  isHint(r: number, c: number): boolean {
    return !!this.hintCells && this.hintCells.some((p) => p.row === r && p.col === c);
  }

  isAnimating(r: number, c: number): boolean {
    return this.animatingCells.has(`${r}-${c}`);
  }

  isFailedMatch(r: number, c: number): boolean {
    return (
      !!this.failedMatchCells && this.failedMatchCells.some((p) => p.row === r && p.col === c)
    );
  }

  isNewNumber(r: number, c: number): boolean {
    return this.newNumberCells.has(`${r}-${c}`);
  }

  getCellId(r: number, c: number): string {
    return `cell-${r}-${c}`;
  }

  getViewBox(state: GameState): string {
    const cols = state.columns;
    const rows = state.grid.length;
    const totalW = cols * this.cellUnit + (cols - 1) * this.gapUnit;
    const totalH = rows * this.cellUnit + (rows - 1) * this.gapUnit;
    return `0 0 ${totalW} ${totalH}`;
  }

  getPointX(point: Point): number {
    return point.col * (this.cellUnit + this.gapUnit) + this.cellUnit / 2;
  }

  getPointY(point: Point): number {
    return point.row * (this.cellUnit + this.gapUnit) + this.cellUnit / 2;
  }

  getPolylinePoints(path: Path): string {
    return path.map((p) => `${this.getPointX(p)},${this.getPointY(p)}`).join(' ');
  }
}
