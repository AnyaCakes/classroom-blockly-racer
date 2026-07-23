import type { MazeDefinition } from '../types/maze.js';
import { sampleMaze } from './sample-maze.js';
import { lShapeMaze } from './l-shape-maze.js';

export const mazeRegistry: Record<string, MazeDefinition> = {
  [sampleMaze.id]: sampleMaze,
  [lShapeMaze.id]: lShapeMaze,
};

export function getMazeById(id: string): MazeDefinition | undefined {
  return mazeRegistry[id];
}
