import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Cell, Point, Path, GameState, AnimationEvent, MatchEvent, GameStats } from '../models/game.models';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private readonly COLS = 9;
  private grid: Cell[][] = [];
  
  // Stats tracking
  private currentScore = 0;
  private stage = 1;
  private numbersCleared: { [key: number]: number } = {};
  private allTimeScore = 0;
  private hintsRemaining = 5;
  private addsRemaining = 3;
  private comboCount = 0;

  private gameStateSubject = new BehaviorSubject<GameState>({
    grid: [],
    columns: this.COLS,
    score: 0,
    time: 0,
    isGameOver: false
  });

  public gameState$ = this.gameStateSubject.asObservable();

  private animationEventSubject = new Subject<AnimationEvent>();
  public animationEvent$ = this.animationEventSubject.asObservable();

  private matchEventSubject = new Subject<MatchEvent>();
  public matchEvent$ = this.matchEventSubject.asObservable();
  
  private statsSubject = new BehaviorSubject<GameStats>({
    currentScore: 0,
    stage: 1,
    numbersCleared: {},
    allTimeScore: 0,
    hintsRemaining: 5,
    addsRemaining: 3
  });
  public stats$ = this.statsSubject.asObservable();

  constructor() {
    this.loadAllTimeScore();
    this.initNumbersCleared();
    this.initGame();
  }
  
  private loadAllTimeScore(): void {
    const saved = localStorage.getItem('numberMatchAllTimeScore');
    this.allTimeScore = saved ? parseInt(saved, 10) : 0;
  }
  
  private saveAllTimeScore(): void {
    localStorage.setItem('numberMatchAllTimeScore', this.allTimeScore.toString());
  }
  
  private initNumbersCleared(): void {
    for (let i = 1; i <= 9; i++) {
      this.numbersCleared[i] = 0;
    }
  }
  
  private updateStats(): void {
    this.statsSubject.next({
      currentScore: this.currentScore,
      stage: this.stage,
      numbersCleared: { ...this.numbersCleared },
      allTimeScore: this.allTimeScore,
      hintsRemaining: this.hintsRemaining,
      addsRemaining: this.addsRemaining
    });
  }

  initGame() {
    this.grid = [];
    this.currentScore = 0;
    this.comboCount = 0;
    this.initNumbersCleared();
    
    const TOTAL_STARTING_CELLS = 42;
    let cellsCreated = 0;

    for (let r = 0; cellsCreated < TOTAL_STARTING_CELLS; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.COLS && cellsCreated < TOTAL_STARTING_CELLS; c++) {
        const val = Math.floor(Math.random() * 9) + 1;
        row.push({
          row: r,
          col: c,
          value: val,
          isOccupied: true,
          wasEverOccupied: true
        });
        cellsCreated++;
      }
      // If the row is not full but we reached the limit, pad it with pristine cells
      if (row.length < this.COLS) {
        const rIdx = r;
        for (let c = row.length; c < this.COLS; c++) {
          row.push({
            row: rIdx,
            col: c,
            value: null,
            isOccupied: false,
            wasEverOccupied: false
          });
        }
      }
      this.grid.push(row);
    }
    this.updateState();
    this.updateStats();
  }

  private updateState() {
    this.gameStateSubject.next({
      grid: this.grid.map(r => r.map(c => ({ ...c }))),
      columns: this.COLS,
      score: this.currentScore,
      time: 0, // Placeholder
      isGameOver: this.checkWin()
    });
  }

  private checkWin(): boolean {
    return this.grid.every(row => row.every(cell => !cell.isOccupied));
  }

  public tryMatch(p1: Point, p2: Point): boolean {
    const cell1 = this.grid[p1.row][p1.col];
    const cell2 = this.grid[p2.row][p2.col];

    if (!cell1.isOccupied || !cell2.isOccupied) return false;
    if (p1.row === p2.row && p1.col === p2.col) return false;

    // Value rule
    const v1 = cell1.value!;
    const v2 = cell2.value!;
    const valueMatch = (v1 === v2) || (v1 + v2 === 10);

    if (!valueMatch) {
      // Emit failed match animation
      this.animationEventSubject.next({
        type: 'failed-match',
        data: { points: [p1, p2] },
        timestamp: Date.now()
      });
      return false;
    }

    // Connectivity rule - only check if values are valid
    const path = this.findPath(p1, p2);
    if (path) {
      // Emit match event with path for visualization
      this.matchEventSubject.next({
        path: path,
        points: [p1, p2],
        timestamp: Date.now()
      });
      
      // Small delay to allow path animation before removing tiles
      setTimeout(() => {
        this.removeTiles(p1, p2);
      }, 300);
      return true;
    } else {
      // Path blocked - get attempted path cells for animation
      const attemptedPathCells = this.getAttemptedPathCells(p1, p2);
      this.animationEventSubject.next({
        type: 'failed-match',
        data: { points: [p1, p2, ...attemptedPathCells] },
        timestamp: Date.now()
      });
    }

    return false;
  }

  private removeTiles(p1: Point, p2: Point) {
    const val1 = this.grid[p1.row][p1.col].value!;
    const val2 = this.grid[p2.row][p2.col].value!;
    
    // Calculate score (base 10 points per match, +5 per combo)
    this.comboCount++;
    const baseScore = 10;
    const comboBonus = Math.max(0, (this.comboCount - 1) * 5);
    this.currentScore += baseScore + comboBonus;
    
    // Update all-time score if needed
    if (this.currentScore > this.allTimeScore) {
      this.allTimeScore = this.currentScore;
      this.saveAllTimeScore();
    }
    
    // Remove the tiles
    this.grid[p1.row][p1.col].isOccupied = false;
    this.grid[p1.row][p1.col].value = null;
    this.grid[p2.row][p2.col].isOccupied = false;
    this.grid[p2.row][p2.col].value = null;

    // Check if these numbers are now completely cleared from the board
    this.updateNumbersCleared();

    this.checkAndRemoveEmptyRows();
    this.updateState();
    this.updateStats();
  }
  
  private updateNumbersCleared(): void {
    // Reset all cleared flags
    for (let i = 1; i <= 9; i++) {
      this.numbersCleared[i] = 0;
    }
    
    // Count remaining instances of each number
    const remaining: { [key: number]: number } = {};
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].isOccupied && this.grid[r][c].value !== null) {
          const val = this.grid[r][c].value!;
          remaining[val] = (remaining[val] || 0) + 1;
        }
      }
    }
    
    // Mark as cleared (1) if number doesn't exist on board
    for (let i = 1; i <= 9; i++) {
      if (!remaining[i]) {
        this.numbersCleared[i] = 1;
      }
    }
  }

  private checkAndRemoveEmptyRows() {
    const removedRows: number[] = [];
    for (let r = this.grid.length - 1; r >= 0; r--) {
      const isEmpty = this.grid[r].every(cell => !cell.isOccupied);
      if (isEmpty) {
        removedRows.push(r);
        this.grid.splice(r, 1);
      }
    }

    if (removedRows.length > 0) {
      // Emit row removal animation event
      this.animationEventSubject.next({
        type: 'remove-row',
        data: { rows: removedRows },
        timestamp: Date.now()
      });
    }

    // After removing rows, we need to update the row/col indices in the remaining cells
    this.grid.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        cell.row = rIdx;
        cell.col = cIdx;
      });
    });
  }

  public addNumbers() {
    if (this.addsRemaining <= 0) return;
    
    this.addsRemaining--;
    this.comboCount = 0; // Reset combo on add
    
    const L: number[] = [];
    for (let r = 0; r < this.grid.length; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (this.grid[r][c].isOccupied) {
          L.push(this.grid[r][c].value!);
        }
      }
    }

    if (L.length === 0) return;

    let insertPos = -1;
    const flattened = this.grid.flat();
    for (let i = flattened.length - 1; i >= 0; i--) {
      if (!flattened[i].isOccupied && !flattened[i].wasEverOccupied) {
        insertPos = i;
        break;
      }
    }

    let startIndex = insertPos + 1;

    const newPositions: Point[] = [];
    let currentIdx = startIndex;
    for (const val of L) {
      let placed = false;
      while (!placed) {
        const r = Math.floor(currentIdx / this.COLS);
        const c = currentIdx % this.COLS;

        if (r >= this.grid.length) {
          const newRow: Cell[] = [];
          for (let nc = 0; nc < this.COLS; nc++) {
            newRow.push({ row: r, col: nc, value: null, isOccupied: false, wasEverOccupied: false });
          }
          this.grid.push(newRow);
        }

        if (!this.grid[r][c].wasEverOccupied) {
          this.grid[r][c].value = val;
          this.grid[r][c].isOccupied = true;
          this.grid[r][c].wasEverOccupied = true;
          newPositions.push({ row: r, col: c });
          placed = true;
        }
        currentIdx++;
      }
    }
    
    // Emit add numbers animation event
    this.animationEventSubject.next({
      type: 'add-numbers',
      data: { positions: newPositions, values: L },
      timestamp: Date.now()
    });
    
    this.updateState();
    this.updateStats();
  }

  private findPath(p1: Point, p2: Point): Path | null {
    // 0 turns: Straight (H, V, D)
    const straight = this.getStraightPath(p1, p2);
    if (straight)
      return straight;

    // Scan Order path (wrapping around rows)
    const scanOrder = this.getScanOrderPath(p1, p2);
    if (scanOrder)
      return scanOrder;

    return null;
  }

  private getAttemptedPathCells(p1: Point, p2: Point): Point[] {
    // Collect cells along attempted paths (excluding the two endpoints)
    const attemptedCells: Point[] = [];
    
    // Try straight path first and collect blocked cells
    const straightBlocked = this.getStraightPathBlocked(p1, p2);
    if (straightBlocked.length > 0) {
      attemptedCells.push(...straightBlocked);
    }
    
    // Try scan order path and collect intermediate cells
    const scanOrderBlocked = this.getScanOrderPathBlocked(p1, p2);
    if (scanOrderBlocked.length > 0) {
      attemptedCells.push(...scanOrderBlocked);
    }
    
    // Remove duplicates and the endpoints
    const unique = new Map<string, Point>();
    attemptedCells.forEach(p => {
      const key = `${p.row}-${p.col}`;
      // Exclude the two endpoint cells
      if (!((p.row === p1.row && p.col === p1.col) || (p.row === p2.row && p.col === p2.col))) {
        unique.set(key, p);
      }
    });
    
    return Array.from(unique.values());
  }

  private getStraightPathBlocked(p1: Point, p2: Point): Point[] {
    const dr = p2.row - p1.row;
    const dc = p2.col - p1.col;

    if (dr === 0 && dc === 0) return [];

    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    // Not a straight line (horizontal, vertical, or diagonal)
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [];

    const blocked: Point[] = [];
    let r = p1.row + stepR;
    let c = p1.col + stepC;

    while (r !== p2.row || c !== p2.col) {
      blocked.push({ row: r, col: c });
      r += stepR;
      c += stepC;
    }

    return blocked;
  }

  private getScanOrderPathBlocked(p1: Point, p2: Point): Point[] {
    const idx1 = p1.row * this.COLS + p1.col;
    const idx2 = p2.row * this.COLS + p2.col;

    const startIdx = Math.min(idx1, idx2);
    const endIdx = Math.max(idx1, idx2);

    const blocked: Point[] = [];
    
    // Collect all cells between startIdx and endIdx (exclusive of endpoints)
    for (let i = startIdx + 1; i < endIdx; i++) {
      const r = Math.floor(i / this.COLS);
      const c = i % this.COLS;
      blocked.push({ row: r, col: c });
    }

    return blocked;
  }

  private getScanOrderPath(p1: Point, p2: Point): Path | null {
    // Convert to linear indices
    const idx1 = p1.row * this.COLS + p1.col;
    const idx2 = p2.row * this.COLS + p2.col;

    const startIdx = Math.min(idx1, idx2);
    const endIdx = Math.max(idx1, idx2);

    const path: Point[] = [];
    // Check all cells between startIdx and endIdx (exclusive)
    for (let i = startIdx + 1; i < endIdx; i++) {
      const r = Math.floor(i / this.COLS);
      const c = i % this.COLS;
      if (this.grid[r][c].isOccupied) return null;
      path.push({ row: r, col: c });
    }

    // If we are here, all intermediate cells are empty.
    // Return path including endpoints for consistency with other findPath methods
    const fullPath = [p1];
    // Add intermediate cells in correct direction
    if (idx1 < idx2) {
      for (let i = idx1 + 1; i < idx2; i++) {
        fullPath.push({ row: Math.floor(i / this.COLS), col: i % this.COLS });
      }
    } else {
      for (let i = idx1 - 1; i > idx2; i--) {
        fullPath.push({ row: Math.floor(i / this.COLS), col: i % this.COLS });
      }
    }
    fullPath.push(p2);
    return fullPath;
  }

  private getStraightPath(p1: Point, p2: Point): Path | null {
    const dr = p2.row - p1.row;
    const dc = p2.col - p1.col;

    if (dr === 0 && dc === 0) return null;

    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;

    let r = p1.row + stepR;
    let c = p1.col + stepC;
    const path: Point[] = [p1];

    while (r !== p2.row || c !== p2.col) {
      if (this.grid[r][c].isOccupied) return null;
      path.push({ row: r, col: c });
      r += stepR;
      c += stepC;
    }
    path.push(p2);
    return path;
  }

  private getOneTurnPath(p1: Point, p2: Point): Path | null {
    // Two possible corners: (p1.row, p2.col) and (p2.row, p1.col)
    const corners = [
      { row: p1.row, col: p2.col },
      { row: p2.row, col: p1.col }
    ];

    for (const corner of corners) {
      if (this.isCellEmpty(corner.row, corner.col)) {
        const path1 = this.getStraightOrthogonalPath(p1, corner);
        const path2 = this.getStraightOrthogonalPath(corner, p2);
        if (path1 && path2) {
          return [...path1, ...path2.slice(1)];
        }
      }
    }
    return null;
  }

  private getTwoTurnPath(p1: Point, p2: Point): Path | null {
    // Two turns means p1 -> corner1 -> corner2 -> p2
    // We can iterate through all possible corner1 that are reachable from p1 in a straight line

    // Check all horizontal and vertical lines from p1
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dr, dc] of directions) {
      let r = p1.row + dr;
      let c = p1.col + dc;
      while (this.isCellWithinBounds(r, c) && this.isCellEmpty(r, c)) {
        const corner1 = { row: r, col: c };
        const oneTurn = this.getOneTurnPath(corner1, p2);
        if (oneTurn) {
          const path1 = this.getStraightOrthogonalPath(p1, corner1);
          return [...path1!, ...oneTurn.slice(1)];
        }
        r += dr;
        c += dc;
      }
    }
    return null;
  }

  private getStraightOrthogonalPath(p1: Point, p2: Point): Path | null {
    if (p1.row !== p2.row && p1.col !== p2.col) return null;
    return this.getStraightPath(p1, p2);
  }

  private isCellEmpty(r: number, c: number): boolean {
    return this.isCellWithinBounds(r, c) && !this.grid[r][c].isOccupied;
  }

  private isCellWithinBounds(r: number, c: number): boolean {
    return r >= 0 && r < this.grid.length && c >= 0 && c < this.COLS;
  }

  public getHint(): [Point, Point] | null {
    if (this.hintsRemaining <= 0) return null;
    
    for (let r1 = 0; r1 < this.grid.length; r1++) {
      for (let c1 = 0; c1 < this.COLS; c1++) {
        if (!this.grid[r1][c1].isOccupied) continue;
        for (let r2 = 0; r2 < this.grid.length; r2++) {
          for (let c2 = 0; c2 < this.COLS; c2++) {
            if (r1 === r2 && c1 === c2) continue;
            if (!this.grid[r2][c2].isOccupied) continue;

            const p1 = { row: r1, col: c1 };
            const p2 = { row: r2, col: c2 };

            const cell1 = this.grid[r1][c1];
            const cell2 = this.grid[r2][c2];
            const v1 = cell1.value!;
            const v2 = cell2.value!;
            if ((v1 === v2) || (v1 + v2 === 10)) {
              if (this.findPath(p1, p2)) {
                this.hintsRemaining--;
                this.updateStats();
                return [p1, p2];
              }
            }
          }
        }
      }
    }
    return null;
  }
  
  public getStats(): GameStats {
    return {
      currentScore: this.currentScore,
      stage: this.stage,
      numbersCleared: { ...this.numbersCleared },
      allTimeScore: this.allTimeScore,
      hintsRemaining: this.hintsRemaining,
      addsRemaining: this.addsRemaining
    };
  }
}
