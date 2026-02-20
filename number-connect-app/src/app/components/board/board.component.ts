import { Component, OnInit, OnDestroy } from '@angular/core';
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
      <div class="grid-wrapper">
        <div class="grid" [style.grid-template-columns]="'repeat(' + state.columns + ', 1fr)'">
          <ng-container *ngFor="let row of state.grid; let rIdx = index">
            <div *ngFor="let cell of row; let cIdx = index"
                 [id]="getCellId(rIdx, cIdx)"
                 class="cell"
                 [class.occupied]="cell.isOccupied"
                 [class.cleared]="!cell.isOccupied && cell.wasEverOccupied"
                 [class.selected]="isSelected(rIdx, cIdx)"
                 [class.hint]="isHint(rIdx, cIdx)"
                 [class.animating]="isAnimating(rIdx, cIdx)"
                 [class.failed-match]="isFailedMatch(rIdx, cIdx)"
                 [class.new-number]="isNewNumber(rIdx, cIdx)"
                 (click)="onCellClick(cell)">
              <span *ngIf="cell.value !== null" class="cell-value">{{cell.value}}</span>
            </div>
          </ng-container>
        </div>
        
        <!-- SVG overlay for path visualization -->
        <svg *ngIf="matchPath" class="path-overlay" 
             [attr.viewBox]="'0 0 ' + (state.columns * 44) + ' ' + (state.grid.length * 44)">
          <path
            [attr.d]="getPathD(state)"
            class="match-path"
            stroke="#2196F3"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            filter="url(#glow)"/>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  `,
  styles: [`
    .board-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-md);
      background: var(--color-background);
      display: flex;
      justify-content: center;
      margin-bottom: 80px;
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
      border-radius: var(--radius-sm);
      cursor: pointer;
      user-select: none;
      transition: all var(--duration-medium) ease;
      position: relative;
      min-height: 36px;
    }
    
    .cell-value {
      font-size: 32px;
      font-weight: 500;
      font-family: var(--font-primary);
    }
    
    .cell.occupied {
      background: var(--color-background);
    }
    
    .cell.occupied .cell-value {
      color: var(--color-text-primary);
    }
    
    .cell.cleared {
      background: #FAFAFA;
    }
    
    .cell.cleared .cell-value {
      color: var(--color-text-cleared);
      font-weight: 400;
      opacity: 0.4;
    }
    
    .cell.selected {
      background: var(--color-selected-bg) !important;
      border: 2px solid var(--color-selected-border);
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
      z-index: 3;
    }
    
    .cell.selected .cell-value {
      color: var(--color-primary);
    }
    
    .cell.hint {
      background: rgba(255, 235, 59, 0.3) !important;
      border: 2px dashed var(--color-warning);
      animation: hint-pulse 2s ease-in-out infinite;
    }
    
    .cell.animating {
      animation: match-success 0.5s ease-out forwards;
    }
    
    .cell.failed-match {
      animation: shake 0.4s ease;
    }
    
    .cell.new-number {
      animation: pop-in 0.3s ease-out;
    }
    
    .path-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    
    .match-path {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: draw-path 0.3s ease-out forwards;
    }
    
    /* Animations */
    @keyframes hint-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 rgba(255, 193, 7, 0.5);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
      }
    }
    
    @keyframes match-success {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(0.8); opacity: 0; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }
    
    @keyframes pop-in {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes draw-path {
      to { stroke-dashoffset: 0; }
    }
    
    /* Responsive adjustments */
    @media (max-width: 360px) {
      .cell-value {
        font-size: 28px;
      }
    }
    
    @media (min-width: 414px) {
      .cell-value {
        font-size: 36px;
      }
    }
  `]
})
export class BoardComponent implements OnInit, OnDestroy {
  gameState$: Observable<GameState>;
  selectedCell: Point | null = null;
  hintCells: Point[] | null = null;
  
  matchPath: Path | null = null;
  animatingCells: Set<string> = new Set();
  failedMatchCells: Point[] | null = null;
  newNumberCells: Set<string> = new Set();
  
  private subscriptions: Subscription[] = [];

  constructor(private gameService: GameService) {
    this.gameState$ = this.gameService.gameState$;
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.gameService.matchEvent$.subscribe(event => {
        this.handleMatchEvent(event);
      })
    );
    
    this.subscriptions.push(
      this.gameService.animationEvent$.subscribe(event => {
        this.handleAnimationEvent(event);
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  private handleMatchEvent(event: MatchEvent): void {
    this.matchPath = event.path;
    
    event.points.forEach(p => {
      this.animatingCells.add(`${p.row}-${p.col}`);
    });
    
    setTimeout(() => {
      this.matchPath = null;
      event.points.forEach(p => {
        this.animatingCells.delete(`${p.row}-${p.col}`);
      });
    }, 1000);
  }
  
  private handleAnimationEvent(event: any): void {
    switch (event.type) {
      case 'failed-match':
        this.failedMatchCells = event.data.points;
        setTimeout(() => {
          this.failedMatchCells = null;
        }, 400);
        break;
        
      case 'add-numbers':
        event.data.positions.forEach((p: Point, index: number) => {
          setTimeout(() => {
            this.newNumberCells.add(`${p.row}-${p.col}`);
            setTimeout(() => {
              this.newNumberCells.delete(`${p.row}-${p.col}`);
            }, 300);
          }, index * 50);
        });
        break;
    }
  }

  onCellClick(cell: Cell) {
    if (!cell.isOccupied) return;

    if (this.selectedCell) {
      if (this.selectedCell.row === cell.row && this.selectedCell.col === cell.col) {
        this.selectedCell = null;
      } else {
        const success = this.gameService.tryMatch(this.selectedCell, { row: cell.row, col: cell.col });
        if (success) {
          this.selectedCell = null;
          this.hintCells = null;
        } else {
          this.selectedCell = { row: cell.row, col: cell.col };
        }
      }
    } else {
      this.selectedCell = { row: cell.row, col: cell.col };
    }
  }

  isSelected(r: number, c: number): boolean {
    return !!this.selectedCell && this.selectedCell.row === r && this.selectedCell.col === c;
  }

  isHint(r: number, c: number): boolean {
    return !!this.hintCells && this.hintCells.some(p => p.row === r && p.col === c);
  }
  
  isAnimating(r: number, c: number): boolean {
    return this.animatingCells.has(`${r}-${c}`);
  }
  
  isFailedMatch(r: number, c: number): boolean {
    return !!this.failedMatchCells && this.failedMatchCells.some(p => p.row === r && p.col === c);
  }
  
  isNewNumber(r: number, c: number): boolean {
    return this.newNumberCells.has(`${r}-${c}`);
  }
  
  getCellId(r: number, c: number): string {
    return `cell-${r}-${c}`;
  }
  
  getPathD(state: GameState): string {
    if (!this.matchPath || this.matchPath.length < 2) return '';
    
    const cellSize = 40;
    const gap = 2;
    const offset = cellSize / 2 + gap / 2;
    
    let d = '';
    
    this.matchPath.forEach((point, index) => {
      const x = point.col * (cellSize + gap) + offset;
      const y = point.row * (cellSize + gap) + offset;
      
      if (index === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    });
    
    return d;
  }
}