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
    <div class="game-container">
      <div class="header">
        <h1>Number Match</h1>
        <div class="stats" *ngIf="gameState$ | async as state">
          <span>Score: {{state.score}}</span>
          <span>Time: {{state.time}}s</span>
        </div>
      </div>

      <div class="grid-container" *ngIf="gameState$ | async as state">
        <div class="grid-wrapper">
          <div class="grid" [style.grid-template-columns]="'repeat(' + state.columns + ', 1fr)'">
            <ng-container *ngFor="let row of state.grid; let rIdx = index">
              <div *ngFor="let cell of row; let cIdx = index"
                   [id]="getCellId(rIdx, cIdx)"
                   class="cell"
                   [class.occupied]="cell.isOccupied"
                   [class.selected]="isSelected(rIdx, cIdx)"
                   [class.hint]="isHint(rIdx, cIdx)"
                   [class.animating]="isAnimating(rIdx, cIdx)"
                   [class.failed-match]="isFailedMatch(rIdx, cIdx)"
                   [class.new-number]="isNewNumber(rIdx, cIdx)"
                   (click)="onCellClick(cell)">
                <span *ngIf="cell.isOccupied">{{cell.value}}</span>
              </div>
            </ng-container>
          </div>
          
          <!-- SVG overlay for path visualization -->
          <svg *ngIf="matchPath" class="path-overlay" [attr.viewBox]="'0 0 ' + (state.columns * 54) + ' ' + (state.grid.length * 54)">
            <path
              [attr.d]="getPathD(state)"
              class="match-path"
              stroke="#1976d2"
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

      <div class="controls">
        <button (click)="onAddClick()" class="btn-add">+</button>
        <button (click)="onHintClick()" class="btn-hint">Hint</button>
        <button (click)="onNewGameClick()" class="btn-new">New Game</button>
      </div>

      <div class="game-over" *ngIf="(gameState$ | async)?.isGameOver">
        <h2>Stage Clear!</h2>
        <button (click)="onNewGameClick()">Next Stage</button>
      </div>
    </div>
  `,
  styles: [`
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
      font-family: sans-serif;
      max-width: 500px;
      margin: 0 auto;
      height: 100vh;
      box-sizing: border-box;
    }
    .header { width: 100%; text-align: center; }
    .stats { display: flex; justify-content: space-around; margin-bottom: 10px; font-weight: bold; }
    .grid-container {
      flex: 1;
      overflow-y: auto;
      width: 100%;
      background: #f0f0f0;
      border-radius: 8px;
      padding: 5px;
    }
    .grid-wrapper {
      position: relative;
    }
    .grid {
      display: grid;
      gap: 4px;
    }
    .cell {
      aspect-ratio: 1;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: bold;
      border-radius: 4px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
      border: 1px solid #ddd;
    }
    .cell.occupied {
      background: #e3f2fd;
      color: #1976d2;
      border-color: #90caf9;
    }
    .cell.selected {
      background: #ffeb3b !important;
      transform: scale(1.1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      animation: pulse 0.3s ease;
    }
    .cell.hint {
      background: #c8e6c9 !important;
      border-color: #4caf50;
      animation: hint-pulse 1s ease-in-out infinite;
    }
    
    /* Match animations */
    .cell.animating {
      animation: match-success 0.5s ease-out;
    }
    
    /* Failed match animation */
    .cell.failed-match {
      animation: shake 0.4s ease;
    }
    
    /* New number animation */
    .cell.new-number {
      animation: pop-in 0.3s ease-out;
    }
    
    /* Path overlay */
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
    
    /* Keyframe animations */
    @keyframes pulse {
      0%, 100% { transform: scale(1.1); }
      50% { transform: scale(1.15); }
    }
    
    @keyframes hint-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
    }
    
    @keyframes match-success {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
      100% { transform: scale(0.8); opacity: 0; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }
    
    @keyframes pop-in {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes draw-path {
      to { stroke-dashoffset: 0; }
    }
    
    .controls {
      display: flex;
      gap: 10px;
      margin-top: 20px;
      padding-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      font-size: 1rem;
      cursor: pointer;
      border: none;
      border-radius: 4px;
      background: #1976d2;
      color: white;
      transition: all 0.2s ease;
    }
    button:hover {
      background: #1565c0;
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    button:active {
      transform: translateY(0);
    }
    .btn-add {
      font-size: 1.5rem;
      width: 50px;
      height: 50px;
      padding: 0;
      border-radius: 50%;
      background: #4caf50;
    }
    .btn-add:hover {
      background: #45a049;
    }
    .game-over {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      text-align: center;
      animation: pop-in 0.3s ease-out;
    }
  `]
})
export class BoardComponent implements OnInit, OnDestroy {
  gameState$: Observable<GameState>;
  selectedCell: Point | null = null;
  hintCells: Point[] | null = null;
  
  // Animation state
  matchPath: Path | null = null;
  animatingCells: Set<string> = new Set();
  failedMatchCells: Point[] | null = null;
  newNumberCells: Set<string> = new Set();
  
  private subscriptions: Subscription[] = [];

  constructor(private gameService: GameService) {
    this.gameState$ = this.gameService.gameState$;
  }

  ngOnInit(): void {
    // Subscribe to match events for path visualization
    this.subscriptions.push(
      this.gameService.matchEvent$.subscribe(event => {
        this.handleMatchEvent(event);
      })
    );
    
    // Subscribe to animation events
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
    
    // Mark cells as animating
    event.points.forEach(p => {
      this.animatingCells.add(`${p.row}-${p.col}`);
    });
    
    // Clear path after animation (increased to 1000ms for better visibility)
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
  
  // Calculate SVG path for match visualization
  getPathD(state: GameState): string {
    if (!this.matchPath || this.matchPath.length < 2) return '';
    
    const cellSize = 50; // Approximate cell size
    const gap = 4;
    const offset = cellSize / 2 + gap / 2;
    
    let d = '';
    
    // Check if this is a scan-order path (row-major adjacency across rows)
    const isScanOrderPath = this.matchPath.length === 2 &&
                            this.matchPath[1].row === this.matchPath[0].row + 1 &&
                            this.matchPath[0].col === state.columns - 1 &&
                            this.matchPath[1].col === 0;
    
    if (isScanOrderPath) {
      // Handle scan-order path with wrap-around visualization
      const start = this.matchPath[0];
      const end = this.matchPath[1];
      
      const startX = start.col * (cellSize + gap) + offset;
      const startY = start.row * (cellSize + gap) + offset;
      
      // Calculate right edge of the grid for the starting row
      const rightEdgeX = state.columns * (cellSize + gap) - gap;
      const rightEdgeY = startY;
      
      // Calculate left edge of the next row
      const leftEdgeX = 0;
      const leftEdgeY = end.row * (cellSize + gap) + offset;
      
      const endX = end.col * (cellSize + gap) + offset;
      const endY = leftEdgeY;
      
      // Draw path: start → right edge → left edge of next row → end
      d = `M ${startX} ${startY}`;
      d += ` L ${rightEdgeX} ${rightEdgeY}`;
      d += ` M ${leftEdgeX} ${leftEdgeY}`;
      d += ` L ${endX} ${endY}`;
    } else {
      // Standard path drawing for all other cases
      this.matchPath.forEach((point, index) => {
        const x = point.col * (cellSize + gap) + offset;
        const y = point.row * (cellSize + gap) + offset;
        
        if (index === 0) {
          d += `M ${x} ${y}`;
        } else {
          d += ` L ${x} ${y}`;
        }
      });
    }
    
    return d;
  }

  onAddClick() {
    this.gameService.addNumbers();
  }

  onHintClick() {
    const hint = this.gameService.getHint();
    if (hint) {
      this.hintCells = [hint[0], hint[1]];
      setTimeout(() => this.hintCells = null, 3000);
    }
  }

  onNewGameClick() {
    this.gameService.initGame();
    this.selectedCell = null;
    this.hintCells = null;
  }
}
