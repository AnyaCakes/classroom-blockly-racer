import type * as Blockly from 'blockly/core';
import type { Program, ProgramNode } from '@racer/shared';

const NODE_TYPE_BY_BLOCK_TYPE: Record<string, ProgramNode['type']> = {
  move_forward: 'moveForward',
  turn_left: 'turnLeft',
  turn_right: 'turnRight',
};

/**
 * Finds the `start_program` hat block and walks the chain of blocks
 * connected under it (via getNextBlock()) into a flat Program.
 * Returns an empty array if there's no start block or nothing is
 * connected under it yet - an empty program is a valid, harmless
 * "Run" click, not an error.
 */
export function workspaceToProgram(workspace: Blockly.Workspace): Program {
  const startBlock = workspace
    .getTopBlocks(true)
    .find((block) => block.type === 'start_program');

  if (!startBlock) return [];

  const firstBlock = startBlock.getInputTargetBlock('DO');
  if (!firstBlock) return [];

  const program: Program = [];
  let current: Blockly.Block | null = firstBlock;

  while (current) {
    const nodeType = NODE_TYPE_BY_BLOCK_TYPE[current.type];
    if (nodeType) {
      program.push({ type: nodeType, blockId: current.id } as ProgramNode);
    }
    current = current.getNextBlock();
  }

  return program;
}
