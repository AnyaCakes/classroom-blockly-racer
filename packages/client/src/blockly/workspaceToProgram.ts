import type * as Blockly from 'blockly/core';
import type { Program, ProgramNode } from '@racer/shared';

/**
 * Converts a single block into a ProgramNode. Recursive for
 * repeat/if, since their bodies are themselves full chains that need
 * the same walk - see walkChain below. Returns null for a block type
 * this doesn't understand (shouldn't happen given the toolbox only
 * offers known types, but a silent skip is safer than a thrown error
 * over one stray/future block type).
 */
function blockToNode(block: Blockly.Block): ProgramNode | null {
  switch (block.type) {
    case 'move_forward':
      return { type: 'moveForward', blockId: block.id };
    case 'turn_left':
      return { type: 'turnLeft', blockId: block.id };
    case 'turn_right':
      return { type: 'turnRight', blockId: block.id };
    case 'repeat_n_times': {
      const count = Number(block.getFieldValue('COUNT')) || 1;
      const body = walkChain(block.getInputTargetBlock('DO'));
      return { type: 'repeat', blockId: block.id, count, body };
    }
    case 'if_wall_ahead': {
      const thenBody = walkChain(block.getInputTargetBlock('THEN'));
      const elseBody = walkChain(block.getInputTargetBlock('ELSE'));
      return { type: 'if', blockId: block.id, sensor: 'wallAhead', thenBody, elseBody };
    }
    default:
      return null;
  }
}

/** Walks a chain of blocks connected via getNextBlock(), starting from `startBlock`, into a flat Program. Used both at the top level (under the start hat) and recursively for repeat/if bodies - same walk, same rules, regardless of nesting depth. */
function walkChain(startBlock: Blockly.Block | null): Program {
  const program: Program = [];
  let current = startBlock;

  while (current) {
    const node = blockToNode(current);
    if (node) program.push(node);
    current = current.getNextBlock();
  }

  return program;
}

/**
 * Finds the `start_program` hat block and walks everything connected
 * under it into a Program, following nested repeat/if bodies to
 * arbitrary depth. Returns an empty array if there's no start block
 * or nothing is connected under it yet - an empty program is a
 * valid, harmless "Run" click, not an error.
 */
export function workspaceToProgram(workspace: Blockly.Workspace): Program {
  const startBlock = workspace
    .getTopBlocks(true)
    .find((block) => block.type === 'start_program');

  if (!startBlock) return [];

  return walkChain(startBlock.getInputTargetBlock('DO'));
}
