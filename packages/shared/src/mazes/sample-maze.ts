import type { MazeDefinition } from '../types/maze.js';

/**
 * A trivial straight-line maze, useful only for wiring/smoke tests
 * (Milestone 3 onward). Real maze content comes later.
 */
export const sampleMaze: MazeDefinition = {
  id: 'sample-01',
  name: 'Straight Line',
  difficulty: 'beginner',
  allowedBlocks: ['sequence'],
  width: 5,
  height: 1,
  grid: [['floor', 'floor', 'floor', 'floor', 'goal']],
  start: { x: 0, y: 0 },
  startFacing: 'E',
  goal: { x: 4, y: 0 },
};
