import type { MazeDefinition } from '../types/maze.js';

/**
 * A four-segment zigzag: E for 2 tiles, turn right, S for 3 tiles,
 * turn LEFT, E for 3 tiles, turn right, S for 3 tiles to the goal.
 * The turn sequence is deliberately not uniform (right, left, right)
 * - a student's first instinct of "repeat: if wall ahead, turn
 * right, else move forward" won't solve this maze outright, which is
 * intentional: it's meant to invite combining loops for the repeated
 * straight segments with explicit turns at the right points, not
 * hand a single reflexive rule that trivializes the conditional
 * block. Each segment/turn was hand-traced against the grid below to
 * confirm the path is continuous and every turn direction is correct
 * for that segment - see the milestone notes for the full trace.
 */
export const zigzagTrailMaze: MazeDefinition = {
  id: 'zigzag-trail',
  name: 'Zigzag Trail',
  difficulty: 'advanced',
  allowedBlocks: ['sequence', 'loops', 'conditionals'],
  width: 7,
  height: 7,
  grid: [
    ['floor', 'floor', 'floor', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'wall', 'floor', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'wall', 'floor', 'wall', 'wall', 'wall', 'wall'],
    ['wall', 'wall', 'floor', 'floor', 'floor', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'floor', 'wall'],
    ['wall', 'wall', 'wall', 'wall', 'wall', 'goal', 'wall'],
  ],
  start: { x: 0, y: 0 },
  startFacing: 'E',
  goal: { x: 5, y: 6 },
};
