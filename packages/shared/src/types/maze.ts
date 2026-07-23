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
 * `blockId` traces each node back to the exact Blockly block that
 * produced it, so the UI can highlight "this is the block that
 * caused the problem" during execution - not just report a step
 * index. Loop/conditional/variable node types are added in the
 * progressive-unlocking milestone; this generator-based interpreter
 * shape (see interpreter/index.ts) is designed so adding them means
 * extending the walk, not changing how callers consume it.
 */
export type ProgramNode =
  | { type: 'moveForward'; blockId: string }
  | { type: 'turnLeft'; blockId: string }
  | { type: 'turnRight'; blockId: string };

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
