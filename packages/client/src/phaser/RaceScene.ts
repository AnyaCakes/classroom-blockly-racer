import Phaser from 'phaser';
import type { CellType, Direction, GridPosition, MazeDefinition, RaceStep, SpriteColorId } from '@racer/shared';
import { DEFAULT_SPRITE_COLOR, getSpriteColorHex } from '@racer/shared';
import { createPlaceholderTextures } from './createPlaceholderTextures.js';
import { facingToRotation, gridToPixel } from './gridToPixel.js';

export const RACE_SCENE_KEY = 'race';

const DIRECTION_DELTA: Record<Direction, GridPosition> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

const TURN_LEFT: Record<Direction, Direction> = { N: 'W', W: 'S', S: 'E', E: 'N' };
const TURN_RIGHT: Record<Direction, Direction> = { N: 'E', E: 'S', S: 'W', W: 'N' };

/**
 * Commands come in and results go out entirely through `bridge`
 * (a plain Phaser.Events.EventEmitter set on the registry by
 * RaceCanvas before the scene starts). This scene never talks to
 * React directly, and never will.
 *
 * Every `command:*` event carries a caller-supplied `commandId`,
 * echoed back on the matching `result:step` emission. This isn't
 * decorative - it's what lets the caller (useProgramRunner) tell a
 * genuine "this is the result for the command I just sent" apart
 * from any other result:step emission, with zero ambiguity about
 * timing. Reset (`command:resetToStart`) doesn't require a caller to
 * wait on it, so it's fire-and-forget and its result carries no id.
 */
export class RaceScene extends Phaser.Scene {
  private maze!: MazeDefinition;
  private bridge!: Phaser.Events.EventEmitter;
  private robot!: Phaser.GameObjects.Image;
  private position!: GridPosition;
  private facing!: Direction;
  private animating = false;

  /** How long the robot shakes in place after hitting a wall/boundary - a deliberate time cost for a mistake, not just a visual flourish. */
  private static readonly BLOCKED_SHAKE_DURATION_MS = 1500;

  constructor() {
    super(RACE_SCENE_KEY);
  }

  create(): void {
    this.maze = this.registry.get('maze');
    this.bridge = this.registry.get('bridge');
    const robotColor: SpriteColorId = this.registry.get('robotColor') ?? DEFAULT_SPRITE_COLOR;

    createPlaceholderTextures(this);
    this.drawGrid();

    this.position = { ...this.maze.start };
    this.facing = this.maze.startFacing;

    const startPixel = gridToPixel(this.position);
    this.robot = this.add.image(startPixel.x, startPixel.y, 'robot');
    this.robot.setRotation(facingToRotation(this.facing));
    this.robot.setTint(getSpriteColorHex(robotColor));

    this.bridge.on('command:moveForward', this.handleMoveForward, this);
    this.bridge.on('command:turnLeft', this.handleTurnLeft, this);
    this.bridge.on('command:turnRight', this.handleTurnRight, this);
    this.bridge.on('command:resetToStart', this.handleResetToStart, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bridge.off('command:moveForward', this.handleMoveForward, this);
      this.bridge.off('command:turnLeft', this.handleTurnLeft, this);
      this.bridge.off('command:turnRight', this.handleTurnRight, this);
      this.bridge.off('command:resetToStart', this.handleResetToStart, this);
    });

    this.bridge.emit('ready');
  }

  private drawGrid(): void {
    for (let y = 0; y < this.maze.height; y++) {
      for (let x = 0; x < this.maze.width; x++) {
        const cell = this.getCell({ x, y });
        const textureKey =
          cell === 'wall' ? 'tile-wall' : cell === 'goal' ? 'tile-goal' : 'tile-floor';
        const pixel = gridToPixel({ x, y });
        this.add.image(pixel.x, pixel.y, textureKey);
      }
    }
  }

  private getCell(pos: GridPosition): CellType {
    const row = this.maze.grid[pos.y];
    const cell = row?.[pos.x];
    if (!cell) {
      throw new Error(`Maze "${this.maze.id}" grid missing cell (${pos.x}, ${pos.y})`);
    }
    return cell;
  }

  private isBlocked(pos: GridPosition): 'wall' | 'boundary' | null {
    if (pos.x < 0 || pos.y < 0 || pos.x >= this.maze.width || pos.y >= this.maze.height) {
      return 'boundary';
    }
    return this.getCell(pos) === 'wall' ? 'wall' : null;
  }

  private handleMoveForward = (commandId: string): void => {
    if (this.animating) return;

    const delta = DIRECTION_DELTA[this.facing];
    const next = { x: this.position.x + delta.x, y: this.position.y + delta.y };
    const blockReason = this.isBlocked(next);

    if (blockReason) {
      this.shakeOnBlocked(blockReason, commandId);
      return;
    }

    this.animating = true;
    const pixel = gridToPixel(next);
    this.tweens.add({
      targets: this.robot,
      x: pixel.x,
      y: pixel.y,
      duration: 300,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.position = next;
        this.animating = false;
        // Exactly one result per command, always - landing on the
        // goal reports 'finished' INSTEAD of 'moved', not in
        // addition to it. Emitting both here previously meant a
        // caller only waiting for a single result (as
        // useProgramRunner does per command) would miss the
        // 'finished' event entirely, since it fired synchronously
        // right after 'moved' with no listener left to catch it.
        if (this.getCell(next) === 'goal') {
          this.emitResult({ action: 'finished', timeMs: 0, position: next, facing: this.facing }, commandId);
        } else {
          this.emitResult({ action: 'moved', position: next, facing: this.facing }, commandId);
        }
      },
    });
  };

  /**
   * Shakes the robot in place for BLOCKED_SHAKE_DURATION_MS, then
   * reports 'blocked'. Uses a real timer (delayedCall) rather than
   * tween-cycle-count math to control the total duration - the shake
   * tween itself just repeats indefinitely for the visual and gets
   * stopped when the timer fires, so the 1.5s penalty is exact
   * regardless of how the wobble looks. `this.animating` stays true
   * for this entire window, so no other command can execute -
   * matched on the caller side by useProgramRunner not advancing to
   * its next node until this exact commandId's result arrives.
   */
  private shakeOnBlocked(reason: 'wall' | 'boundary', commandId: string): void {
    this.animating = true;
    const originX = this.robot.x;
    const originY = this.robot.y;

    const shakeTween = this.tweens.add({
      targets: this.robot,
      x: originX + 6,
      duration: 60,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.time.delayedCall(RaceScene.BLOCKED_SHAKE_DURATION_MS, () => {
      shakeTween.stop();
      this.robot.setPosition(originX, originY);
      this.animating = false;
      this.emitResult({ action: 'blocked', reason, position: this.position, facing: this.facing }, commandId);
    });
  }

  private handleTurnLeft = (commandId: string): void => {
    if (this.animating) return;
    this.rotateRobot(TURN_LEFT[this.facing], commandId);
  };

  private handleTurnRight = (commandId: string): void => {
    if (this.animating) return;
    this.rotateRobot(TURN_RIGHT[this.facing], commandId);
  };

  private rotateRobot(nextFacing: Direction, commandId: string): void {
    this.animating = true;
    // NOTE: this tweens the raw rotation value, which can spin "the
    // long way around" between some facing pairs (e.g. W -> N) since
    // it doesn't normalize direction of travel. Cosmetic only - fine
    // for placeholder graphics, worth revisiting once real robot art
    // lands in the polish milestone.
    this.tweens.add({
      targets: this.robot,
      rotation: facingToRotation(nextFacing),
      duration: 200,
      onComplete: () => {
        this.facing = nextFacing;
        this.animating = false;
        this.emitResult({ action: 'turned', facing: nextFacing }, commandId);
      },
    });
  }

  /**
   * Not gated by `this.animating` - unlike every other command, this
   * one is meant to work even while the robot is mid-shake or
   * mid-move, since it's the student's explicit "start over" action
   * and shouldn't be blocked by the very animation it's cancelling.
   * Fire-and-forget: nothing waits on this result, so it carries no
   * commandId.
   */
  private handleResetToStart = (): void => {
    this.tweens.killTweensOf(this.robot);
    this.animating = false;
    this.position = { ...this.maze.start };
    this.facing = this.maze.startFacing;
    const pixel = gridToPixel(this.position);
    this.robot.setPosition(pixel.x, pixel.y);
    this.robot.setRotation(facingToRotation(this.facing));
    this.emitResult({ action: 'moved', position: this.position, facing: this.facing }, null);
  };

  private emitResult(step: RaceStep, commandId: string | null): void {
    this.bridge.emit('result:step', commandId, step);
  }
}
