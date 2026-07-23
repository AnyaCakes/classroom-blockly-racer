import type { Program, ProgramNode } from '../types/maze.js';

/**
 * Walks a Program and yields each executable node in order.
 *
 * Today (sequencing-only) this is close to a plain array iteration -
 * that's expected, not a sign it's over-engineered. It's written as
 * a generator specifically so the progressive-unlocking milestone can
 * add `repeat`/`if` node types by extending the switch below (looping
 * back and re-yielding a node's body, or conditionally skipping it)
 * without changing this function's calling convention at all. Every
 * consumer (see client/src/features/race/useProgramRunner.ts) just
 * pulls `ProgramNode`s one at a time and reacts to each - it never
 * needs to know whether a node came from a straight line or a loop.
 */
export function* runProgram(program: Program): Generator<ProgramNode> {
  for (const node of program) {
    switch (node.type) {
      case 'moveForward':
      case 'turnLeft':
      case 'turnRight':
        yield node;
        break;
      default: {
        // Exhaustiveness guard - fails to compile if a new ProgramNode
        // variant is added without being handled here.
        const _exhaustive: never = node;
        throw new Error(`Unhandled program node: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }
}
