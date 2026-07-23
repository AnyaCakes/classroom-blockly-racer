import * as Blockly from 'blockly/core';

/**
 * One hat block programs snap under, plus the three movement blocks.
 * Kept intentionally minimal (no fields, no nesting beyond simple
 * stacking) for the sequencing-only milestone. `repeat`/`if` blocks
 * added in the progressive-unlocking milestone go in this same file,
 * following the same pattern.
 */
export const BLOCK_COLORS = {
  hat: 120,
  movement: 210,
} as const;

export function registerCustomBlocks(): void {
  Blockly.Blocks['start_program'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('when race starts');
      this.appendStatementInput('DO');
      this.setColour(BLOCK_COLORS.hat);
      this.setDeletable(false);
      this.setMovable(false);
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
}

/** Toolbox offering only the movement blocks - the hat block is seeded directly into the workspace, not draggable from the palette. */
export const TOOLBOX = {
  kind: 'flyoutToolbox',
  contents: [
    { kind: 'block', type: 'move_forward' },
    { kind: 'block', type: 'turn_left' },
    { kind: 'block', type: 'turn_right' },
  ],
};

export const STARTER_WORKSPACE_XML = `
  <xml>
    <block type="start_program" id="start_block" deletable="false" movable="false" x="20" y="20"></block>
  </xml>
`;
