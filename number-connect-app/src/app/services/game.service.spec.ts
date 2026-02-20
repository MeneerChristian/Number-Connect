import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { GameState } from '../models/game.models';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    try {
      localStorage.removeItem('numberConnect_gameState');
      localStorage.removeItem('numberConnect_stars');
      localStorage.removeItem('numberConnect_stage');
      localStorage.removeItem('numberConnect_topScore');
    } catch {}
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize game with 42 occupied cells in a 9-column grid', () => {
    let state: GameState | undefined;
    service.gameState$.subscribe((s) => (state = s));

    expect(state).toBeDefined();
    expect(state!.columns).toBe(9);

    let occupiedCount = 0;
    for (const row of state!.grid) {
      for (const cell of row) {
        if (cell.isOccupied) occupiedCount++;
      }
    }
    expect(occupiedCount).toBe(42);
  });

  it('should start with correct stats', () => {
    const stats = service.getStats();
    expect(stats.currentScore).toBe(0);
    expect(stats.stage).toBe(1);
    expect(stats.stars).toBe(0);
    expect(stats.hintCost).toBe(1);
    expect(stats.addsRemaining).toBe(3);
  });

  it('should match equal numbers on adjacent cells', async () => {
    let state: GameState | undefined;
    service.gameState$.subscribe((s) => (state = s));

    // Find two adjacent cells with equal values or values summing to 10
    const grid = state!.grid;
    let matched = false;

    for (let r = 0; r < grid.length && !matched; r++) {
      for (let c = 0; c < grid[r].length - 1 && !matched; c++) {
        const cell1 = grid[r][c];
        const cell2 = grid[r][c + 1];
        if (cell1.isOccupied && cell2.isOccupied) {
          const v1 = cell1.value!;
          const v2 = cell2.value!;
          if (v1 === v2 || v1 + v2 === 10) {
            const result = service.tryMatch({ row: r, col: c }, { row: r, col: c + 1 });
            expect(result).toBe(true);
            matched = true;
          }
        }
      }
    }

    // Score update is delayed by 300ms setTimeout in tryMatch
    if (matched) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const stats = service.getStats();
      expect(stats.currentScore).toBe(2);
    }
  });

  it('should reject matching same cell', () => {
    const result = service.tryMatch({ row: 0, col: 0 }, { row: 0, col: 0 });
    expect(result).toBe(false);
  });

  it('should decrement adds remaining after addNumbers', () => {
    const before = service.getStats().addsRemaining;
    service.addNumbers();
    const after = service.getStats().addsRemaining;
    expect(after).toBe(before - 1);
  });

  it('should create a new game with newGame()', () => {
    service.addNumbers(); // Use one add
    const statsAfterAdd = service.getStats();
    expect(statsAfterAdd.addsRemaining).toBe(2);

    service.newGame();
    const statsAfterNew = service.getStats();
    expect(statsAfterNew.addsRemaining).toBe(3);
    expect(statsAfterNew.currentScore).toBe(0);
  });
});
