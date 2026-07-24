import type { MazeDefinition } from '../types/maze.js';

/**
 * Three sides of a 5x5 square (top, right, bottom edges) - start at
 * the top-left corner facing East, goal at the bottom-left corner.
 * Traveling clockwise means both corners are right turns, so
 * "repeat: if wall ahead, turn right, else move forward" solves the
 * whole thing with one uniform rule - hand-traced below to confirm:
 *
 *   (0,0)->(1,0)->(2,0)->(3,0)->(4,0)  [top row, facing E, 4 moves]
 *   turn right at (4,0): E -> S
 *   (4,0)->(4,1)->(4,2)->(4,3)->(4,4)  [right column, facing S, 4 moves]
 *   turn right at (4,4): S -> W
 *   (4,4)->(3,4)->(2,4)->(1,4)->(0,4)  [bottom row, facing W, 4 moves] = goal
 *
 * 12 moves + 2 turns = 14 total actions, matching "repeat 14" if a
 * student writes the single-rule version.
 */
export const ringMaze: MazeDefinition = {
  id: 'ring-maze',
  name: 'Ring Maze',
  difficulty: 'intermediate',
  allowedBlocks: ['sequence', 'loops', 'conditionals'],
  width: 5,
  height: 5,
  grid: [
    ['floor', 'floor', 'floor', 'floor', 'floor'],
    ['wall', 'wall', 'wall', 'wall', 'floor'],
    ['wall', 'wall', 'wall', 'wall', 'floor'],
    ['wall', 'wall', 'wall', 'wall', 'floor'],
    ['goal', 'floor', 'floor', 'floor', 'floor'],
  ],
  start: { x: 0, y: 0 },
  startFacing: 'E',
  goal: { x: 0, y: 4 },
};
