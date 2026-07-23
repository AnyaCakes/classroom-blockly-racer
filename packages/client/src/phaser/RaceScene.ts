import Phaser from 'phaser';
import type { CellType, Direction, GridPosition, MazeDefinition, RaceStep } from '@racer/shared';
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
 * React directly, and never will - Milestone 4's interpreter will
 * emit the exact same `command:*` events this scene already
 * understands, just driven by a Blockly program instead of buttons.
 */
export class RaceScene extends Phaser.Scene {
  private maze!: MazeDefinition;
  private bridge!: Phaser.Events.EventEmitter;
  private robot!: Phaser.GameObjects.Image;
  private position!: GridPosition;
  private facing!: Direction;
  private animating = false;

  constructor() {
    super(RACE_SCENE_KEY);
  }

  create(): void {
    this.maze = this.registry.get('maze');
    this.bridge = this.registry.get('bridge');

    createPlaceholderTextures(this);
    this.drawGrid();

    this.position = { ...this.maze.start };
    this.facing = this.maze.startFacing;

    const startPixel = gridToPixel(this.position);
    this.robot = this.add.image(startPixel.x, startPixel.y, 'robot');
    this.robot.setRotation(facingToRotation(this.facing));

    this.bridge.on('command:moveForward', this.handleMoveForward, this);
    this.bridge.on('command:turnLeft', this.handleTurnLeft, this);
    this.bridge.on('command:turnRight', this.handleTurnRight, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bridge.off('command:moveForward', this.handleMoveForward, this);
      this.bridge.off('command:turnLeft', this.handleTurnLeft, this);
      this.bridge.off('command:turnRight', this.handleTurnRight, this);
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

  private handleMoveForward = (): void => {
    if (this.animating) return;

    const delta = DIRECTION_DELTA[this.facing];
    const next = { x: this.position.x + delta.x, y: this.position.y + delta.y };
    const blockReason = this.isBlocked(next);

    if (blockReason) {
      this.emitResult({ action: 'blocked', reason: blockReason, position: this.position });
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
        this.emitResult({ action: 'moved', position: next, facing: this.facing });
        if (this.getCell(next) === 'goal') {
          this.emitResult({ action: 'finished', timeMs: 0 });
        }
      },
    });
  };

  private handleTurnLeft = (): void => {
    if (this.animating) return;
    this.rotateRobot(TURN_LEFT[this.facing]);
  };

  private handleTurnRight = (): void => {
    if (this.animating) return;
    this.rotateRobot(TURN_RIGHT[this.facing]);
  };

  private rotateRobot(nextFacing: Direction): void {
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
        this.emitResult({ action: 'turned', facing: nextFacing });
      },
    });
  }

  private emitResult(step: RaceStep): void {
    this.bridge.emit('result:step', step);
  }
}
