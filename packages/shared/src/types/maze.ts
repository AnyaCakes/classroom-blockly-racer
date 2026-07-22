export type CellType = 'floor' | 'wall' | 'goal';

export type Direction = 'N' | 'E' | 'S' | 'W';

export interface GridPosition {
  x: number;
  y: number;
}

export interface MazeDefinition {
  id: string;
  name: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Which block categories are unlocked for this maze. */
  allowedBlocks: BlockCategory[];
  width: number;
  height: number;
  /** Row-major grid, grid[y][x]. */
  grid: CellType[][];
  start: GridPosition;
  startFacing: Direction;
  goal: GridPosition;
}

export type BlockCategory =
  | 'sequence'
  | 'loops'
  | 'conditionals'
  | 'variables'
  | 'functions';

/**
 * The program AST produced by walking a Blockly workspace.
 * This is intentionally small for Milestone 1 — only what's needed
 * to prove the shared-package/interpreter shape end to end.
 * Loop/conditional/variable node types are added in later milestones.
 */
export type ProgramNode =
  | { type: 'moveForward' }
  | { type: 'turnLeft' }
  | { type: 'turnRight' };

export type Program = ProgramNode[];

/**
 * A single yielded step from the interpreter. The client turns this
 * into an animation frame; the server (later) uses it for verification.
 */
export type RaceStep =
  | { action: 'moved'; position: GridPosition; facing: Direction }
  | { action: 'turned'; facing: Direction }
  | { action: 'blocked'; reason: 'wall' | 'boundary'; position: GridPosition }
  | { action: 'finished'; timeMs: number };
