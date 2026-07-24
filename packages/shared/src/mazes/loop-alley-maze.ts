import type { MazeDefinition } from '../types/maze.js';

/**
 * A long straight run - solvable with 8 individual move_forward
 * blocks, but that's exactly the point: it's tedious enough to make
 * "repeat 8 times: move forward" an obviously better answer. First
 * maze whose allowedBlocks includes 'loops'.
 */
export const loopAlleyMaze: MazeDefinition = {
  id: 'loop-alley',
  name: 'Loop Alley',
  difficulty: 'intermediate',
  allowedBlocks: ['sequence', 'loops'],
  width: 9,
  height: 1,
  grid: [['floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'floor', 'goal']],
  start: { x: 0, y: 0 },
  startFacing: 'E',
  goal: { x: 8, y: 0 },
};
