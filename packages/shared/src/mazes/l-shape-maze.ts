import type { MazeDefinition } from '../types/maze.js';

/**
 * An L-shaped maze requiring one turn. Exists (alongside sample-maze)
 * so Milestone 3 can prove maze rendering is genuinely data-driven -
 * swapping which maze the server sends produces a visibly different
 * layout, not a hardcoded one.
 */
export const lShapeMaze: MazeDefinition = {
  id: 'l-shape-01',
  name: 'Around the Corner',
  difficulty: 'beginner',
  allowedBlocks: ['sequence'],
  width: 4,
  height: 4,
  grid: [
    ['floor', 'wall', 'wall', 'wall'],
    ['floor', 'wall', 'wall', 'wall'],
    ['floor', 'wall', 'wall', 'wall'],
    ['floor', 'floor', 'floor', 'goal'],
  ],
  start: { x: 0, y: 0 },
  startFacing: 'S',
  goal: { x: 3, y: 3 },
};
