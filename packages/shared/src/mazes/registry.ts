import type { MazeDefinition } from '../types/maze.js';
import { sampleMaze } from './sample-maze.js';
import { lShapeMaze } from './l-shape-maze.js';
import { loopAlleyMaze } from './loop-alley-maze.js';
import { zigzagTrailMaze } from './zigzag-trail-maze.js';

export const mazeRegistry: Record<string, MazeDefinition> = {
  [sampleMaze.id]: sampleMaze,
  [lShapeMaze.id]: lShapeMaze,
  [loopAlleyMaze.id]: loopAlleyMaze,
  [zigzagTrailMaze.id]: zigzagTrailMaze,
};

export function getMazeById(id: string): MazeDefinition | undefined {
  return mazeRegistry[id];
}
