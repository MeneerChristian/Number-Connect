export interface Cell {
  row: number;
  col: number;
  value: number | null;
  isOccupied: boolean;
  wasEverOccupied: boolean;
}

export interface Point {
  row: number;
  col: number;
}

export type Path = Point[];

export interface GameState {
  grid: Cell[][];
  columns: number;
  score: number;
  time: number;
  isGameOver: boolean;
}

export interface MatchEvent {
  path: Path;
  points: [Point, Point];
  timestamp: number;
}

export interface AnimationEvent {
  type: 'match' | 'failed-match' | 'add-numbers' | 'remove-row';
  data?: any;
  timestamp: number;
}

export interface GameStats {
  currentScore: number;
  stage: number;
  numbersCleared: {
    [key: number]: number; // Count for each number 1-9
  };
  allTimeScore: number;
  hintsRemaining: number;
  addsRemaining: number;
}
