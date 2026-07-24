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
 * What an `if` block can check. A fixed, closed set (not a general
 * boolean expression) - deliberately scoped that way for the
 * progressive-unlocking milestone; general expressions/comparisons
 * are variables/functions territory, out of scope here.
 */
export type SensorType = 'wallAhead';

/**
 * The program AST produced by walking a Blockly workspace.
 * `blockId` traces each node back to the exact Blockly block that
 * produced it, so the UI can highlight "this is the block that
 * caused the problem" during execution - not just report a step
 * index.
 *
 * `repeat` and `if` nest arbitrarily (a `body`/`thenBody`/`elseBody`
 * is itself a full `Program`), which the generator-based interpreter
 * (see interpreter/index.ts) walks recursively via `yield*` - nesting
 * depth was never something the interpreter's shape needed to change
 * for, exactly as designed back when it was still just a flat walk.
 */
export type ProgramNode =
  | { type: 'moveForward'; blockId: string }
  | { type: 'turnLeft'; blockId: string }
  | { type: 'turnRight'; blockId: string }
  | { type: 'repeat'; blockId: string; count: number; body: Program }
  | { type: 'if'; blockId: string; sensor: SensorType; thenBody: Program; elseBody: Program };

export type Program = ProgramNode[];

/**
 * A single yielded step from the interpreter. The client turns this
 * into an animation frame; the server (later) uses it for verification.
 */
export type RaceStep =
  | { action: 'moved'; position: GridPosition; facing: Direction }
  | { action: 'turned'; facing: Direction }
  | { action: 'blocked'; reason: 'wall' | 'boundary'; position: GridPosition; facing: Direction }
  | { action: 'finished'; timeMs: number; position: GridPosition; facing: Direction }
  /** Answer to a sensor check ('if' block) - not a robot action, so deliberately excluded from opponent-progress reporting (see useRaceProgressReporting.ts). */
  | { action: 'sensor'; sensor: SensorType; result: boolean };
