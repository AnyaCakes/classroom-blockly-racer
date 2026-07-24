import type { Program, ProgramNode, SensorType } from '../types/maze.js';

/**
 * What runProgram yields, one item at a time:
 *  - 'command': "execute this movement node" - the caller (see
 *    client/src/features/race/useProgramRunner.ts) drives it through
 *    the scene and calls .next() to continue; nothing needs to be
 *    passed back in.
 *  - 'sensorCheck': "answer this question before I continue" - the
 *    caller MUST resolve it (via the scene) and pass the boolean
 *    answer back through .next(answer). This is the two-way
 *    communication the generator shape was built for back when it
 *    only had 'command' to yield - see the Milestone 4 interpreter
 *    for the "why a generator at all" reasoning.
 */
export type InterpreterYield =
  | { kind: 'command'; node: ProgramNode & { type: 'moveForward' | 'turnLeft' | 'turnRight' } }
  | { kind: 'sensorCheck'; blockId: string; sensor: SensorType };

/**
 * Walks a Program, recursively descending into `repeat`/`if` bodies
 * via `yield*` - delegation that transparently forwards both what
 * this generator yields AND what the caller sends back via
 * `.next(answer)`, so nesting depth is invisible to callers; a
 * sensorCheck three loops deep behaves identically to one at the top
 * level. `repeat` needs no runtime information (the count is fixed
 * at AST-build time), so it just re-walks its body that many times.
 * `if` is the one case that actually needs the caller's help: it
 * yields a sensorCheck and doesn't know which branch to take until
 * the answer comes back.
 */
function* walk(nodes: Program): Generator<InterpreterYield, void, boolean | undefined> {
  for (const node of nodes) {
    switch (node.type) {
      case 'moveForward':
      case 'turnLeft':
      case 'turnRight':
        yield { kind: 'command', node };
        break;

      case 'repeat':
        for (let i = 0; i < node.count; i++) {
          yield* walk(node.body);
        }
        break;

      case 'if': {
        const wallAhead = yield { kind: 'sensorCheck', blockId: node.blockId, sensor: node.sensor };
        yield* walk(wallAhead ? node.thenBody : node.elseBody);
        break;
      }

      default: {
        // Exhaustiveness guard - fails to compile if a new ProgramNode
        // variant is added without being handled here.
        const _exhaustive: never = node;
        throw new Error(`Unhandled program node: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }
}

export function* runProgram(program: Program): Generator<InterpreterYield, void, boolean | undefined> {
  yield* walk(program);
}
