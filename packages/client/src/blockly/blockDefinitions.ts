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

/**
 * Makes dragging any block act on that single block only, healing
 * the stack (reconnecting the block above directly to the block
 * below) automatically, instead of dragging the whole downstream
 * stack.
 *
 * `BlockDragStrategy.shouldHealStack()` - the protected override
 * point that makes this a one-line change - doesn't exist yet in the
 * installed Blockly version (11.2.2, the latest release matching the
 * pinned `^11.1.1`); it was added in Blockly 12.0.0. In 11.2.2 the
 * heal-vs-drag-whole-stack decision is made by two *private* methods
 * (`shouldDisconnect`/`disconnectBlock`) with no subclass hook at
 * all, so there's no equivalent one-liner available at this version.
 *
 * Instead, this reaches for `Block.unplug(healStack)` - a long-
 * standing *public* API (unrelated to the newer drag-strategy
 * internals) that already does exactly "detach this block, and if
 * healStack is true, reconnect the block that was below it to the
 * block that was above it." Calling it on the target block before
 * `super.startDrag()` runs means the block has already healed itself
 * out of the stack by the time the base class's own (non-healing-by-
 * default) disconnect logic looks at it - which then simply finds
 * nothing left to disconnect on that side. Captured at construction
 * time (not looked up via the base class's protected
 * `getTargetBlock()`) specifically so this never touches the
 * flyout's template block when dragging a fresh block out of the
 * palette - only the real, already-on-workspace block this strategy
 * was actually bound to in `useSingleBlockDragStrategy` below.
 */
class SingleBlockDragStrategy extends Blockly.dragging.BlockDragStrategy {
  private readonly targetBlock: Blockly.BlockSvg;

  constructor(block: Blockly.BlockSvg) {
    super(block);
    this.targetBlock = block;
  }

  override startDrag(e?: PointerEvent): void {
    this.targetBlock.unplug(true);
    super.startDrag(e);
  }
}

function useSingleBlockDragStrategy(block: Blockly.BlockSvg): void {
  block.setDragStrategy(new SingleBlockDragStrategy(block));
}

export function registerCustomBlocks(): void {
  Blockly.Blocks['start_program'] = {
    init(this: Blockly.BlockSvg) {
      this.appendDummyInput().appendField('when race starts');
      this.appendStatementInput('DO');
      this.setColour(BLOCK_COLORS.hat);
      // Deliberately NOT setDeletable(false)/setMovable(false) - this
      // is a normal block a student can drag in, move, and delete
      // like any other, available from the toolbox alongside the
      // movement blocks.
      useSingleBlockDragStrategy(this);
    },
  };

  Blockly.Blocks['move_forward'] = {
    init(this: Blockly.BlockSvg) {
      this.appendDummyInput().appendField('move forward');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.movement);
      useSingleBlockDragStrategy(this);
    },
  };

  Blockly.Blocks['turn_left'] = {
    init(this: Blockly.BlockSvg) {
      this.appendDummyInput().appendField('turn left');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.movement);
      useSingleBlockDragStrategy(this);
    },
  };

  Blockly.Blocks['turn_right'] = {
    init(this: Blockly.BlockSvg) {
      this.appendDummyInput().appendField('turn right');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.movement);
      useSingleBlockDragStrategy(this);
    },
  };

  Blockly.Blocks['repeat_n_times'] = {
    init(this: Blockly.BlockSvg) {
      this.appendDummyInput()
        .appendField('repeat')
        .appendField(new Blockly.FieldNumber(3, 1, 20, 1), 'COUNT')
        .appendField('times');
      this.appendStatementInput('DO');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.loop);
      useSingleBlockDragStrategy(this);
    },
  };

  Blockly.Blocks['if_wall_ahead'] = {
    init(this: Blockly.BlockSvg) {
      this.appendDummyInput().appendField('if wall ahead');
      this.appendStatementInput('THEN').appendField('do');
      this.appendStatementInput('ELSE').appendField('else');
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(BLOCK_COLORS.conditional);
      useSingleBlockDragStrategy(this);
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
