import * as Blockly from 'blockly/core';
import type { BlockCategory } from '@racer/shared';

/**
 * Custom block definitions matching exactly what the interpreter
 * understands. `repeat_n_times` and `if_wall_ahead` follow the same
 * "no free-form fields beyond what's needed" philosophy as the
 * Milestone 4 movement blocks - repeat takes a plain count, and the
 * conditional checks a single fixed sensor rather than exposing a
 * general boolean-expression slot.
 */
export const BLOCK_COLORS = {
  hat: 120,
  movement: 210,
  loop: 290,
  conditional: 20,
} as const;

export function registerCustomBlocks(): void {
  Blockly.Blocks['start_program'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('when race starts');
      this.appendStatementInput('DO');
      this.setColour(BLOCK_COLORS.hat);
      // Deliberately NOT setDeletable(false)/setMovable(false) - this
      // is a normal block a student can drag in, move, and delete
      // like any other, available from the toolbox alongside the
      // movement blocks.
    },
  };

  Blockly.Blocks['move_forward'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('move forward');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.movement);
    },
  };

  Blockly.Blocks['turn_left'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('turn left');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.movement);
    },
  };

  Blockly.Blocks['turn_right'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('turn right');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.movement);
    },
  };

  Blockly.Blocks['repeat_n_times'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField('repeat')
        .appendField(new Blockly.FieldNumber(3, 1, 20, 1), 'COUNT')
        .appendField('times');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.loop);
    },
  };

  Blockly.Blocks['if_wall_ahead'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('if wall ahead');
      this.appendStatementInput('THEN').appendField('do');
      this.appendStatementInput('ELSE').appendField('else');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.conditional);
    },
  };
}

/**
 * Builds the toolbox for a specific maze's `allowedBlocks` - the
 * mechanism behind "new harder mazes only" progressive unlocking.
 * Sequence blocks (start/move/turn) are always available; repeat/if
 * only show up once a maze's `allowedBlocks` actually includes them.
 */
export function buildToolbox(allowedBlocks: BlockCategory[]) {
  const contents: { kind: 'block'; type: string }[] = [
    { kind: 'block', type: 'start_program' },
    { kind: 'block', type: 'move_forward' },
    { kind: 'block', type: 'turn_left' },
    { kind: 'block', type: 'turn_right' },
  ];

  if (allowedBlocks.includes('loops')) {
    contents.push({ kind: 'block', type: 'repeat_n_times' });
  }
  if (allowedBlocks.includes('conditionals')) {
    contents.push({ kind: 'block', type: 'if_wall_ahead' });
  }

  return { kind: 'flyoutToolbox', contents };
}

/** Seeded into a fresh/cleared workspace purely for convenience - it's a normal, deletable block from here on, not special. */
export const STARTER_WORKSPACE_XML = `
  <xml>
    <block type="start_program" id="start_block" x="20" y="20"></block>
  </xml>
`;
