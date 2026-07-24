import type { MazeDefinition } from '../types/maze.js';

/**
 * Where a student lands automatically after finishing a race, so
 * "done early" means "free practice," not "sit and wait." All floor,
 * no walls, and critically no 'goal' cell anywhere in the grid - the
 * interpreter/scene's finish check only fires on landing on a cell
 * whose type is 'goal', so this maze structurally can never be
 * "solved." The `goal` field is still populated because
 * MazeDefinition requires it, but it's meaningless here.
 */
export const practiceMaze: MazeDefinition = {
  id: 'practice-grid',
  name: 'Practice Grid',
  difficulty: 'beginner',
  allowedBlocks: ['sequence', 'loops'],
  width: 8,
  height: 8,
  grid: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => 'floor' as const)),
  start: { x: 3, y: 3 },
  startFacing: 'E',
  goal: { x: 0, y: 0 },
};
