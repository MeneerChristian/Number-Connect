import { Component, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { GameState, Point, Cell, MatchEvent, Path } from '../../models/game.models';
import { Observable, Subscription } from 'rxjs';
import { RippleDirective } from '../../directives/ripple.directive';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, RippleDirective],
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
              [class.valid-match]="isValidMatch(rIdx, cIdx)"
              appRipple
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
  styleUrl: './board.component.css',
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
  validMatchCell: { row: number; col: number } | null = null;

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
        const secondCell = { row: cell.row, col: cell.col };
        const firstCell = this.selectedCell;

        // Show green tint on the second cell before executing the match
        this.validMatchCell = secondCell;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.validMatchCell = null;
          const success = this.gameService.tryMatch(firstCell, secondCell);
          if (success) {
            this.selectedCell = null;
          } else {
            this.selectedCell = secondCell;
          }
          this.cdr.detectChanges();
        }, 100);
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

  isValidMatch(r: number, c: number): boolean {
    return !!this.validMatchCell && this.validMatchCell.row === r && this.validMatchCell.col === c;
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
