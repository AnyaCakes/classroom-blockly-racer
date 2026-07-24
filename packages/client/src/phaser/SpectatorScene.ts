import Phaser from 'phaser';
import type { CellType, GridPosition, MazeDefinition, RaceStep, SpriteColorId } from '@racer/shared';
import { getSpriteColorHex } from '@racer/shared';
import { createPlaceholderTextures } from './createPlaceholderTextures.js';
import { facingToRotation, gridToPixel } from './gridToPixel.js';

export const SPECTATOR_SCENE_KEY = 'spectator';

export interface SpectatorPlayerInfo {
  /** Stable identity across reconnects - matches the id used in race:opponentProgress. */
  clientId: string;
  color: SpriteColorId;
  connected: boolean;
}

/**
 * Renders every student's robot on one shared maze for the teacher's
 * dashboard. Deliberately dumb: it never computes movement or
 * collisions itself - each student's own browser already did that
 * (see RaceScene) and reported the result. This scene just replays
 * those reported steps as animation. If a step ever disagreed with
 * what's physically possible, that's a client-side cheating concern
 * for a future anti-cheat pass (see the Phase 1 notes on server-side
 * verification), not something this view needs to detect.
 */
export class SpectatorScene extends Phaser.Scene {
  private maze!: MazeDefinition;
  private bridge!: Phaser.Events.EventEmitter;
  private robots = new Map<string, Phaser.GameObjects.Image>();

  constructor() {
    super(SPECTATOR_SCENE_KEY);
  }

  create(): void {
    this.maze = this.registry.get('maze');
    this.bridge = this.registry.get('bridge');
    const players: SpectatorPlayerInfo[] = this.registry.get('players') ?? [];

    createPlaceholderTextures(this);
    this.drawGrid();

    for (const player of players) {
      this.createRobot(player.clientId, player.color, player.connected);
    }

    this.bridge.on('opponent:step', this.handleOpponentStep, this);
    this.bridge.on('players:sync', this.handlePlayersSync, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.bridge.off('opponent:step', this.handleOpponentStep, this);
      this.bridge.off('players:sync', this.handlePlayersSync, this);
    });
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

  private createRobot(clientId: string, color: SpriteColorId, connected: boolean): Phaser.GameObjects.Image {
    const pixel = gridToPixel(this.maze.start);
    const robot = this.add.image(pixel.x, pixel.y, 'robot');
    robot.setRotation(facingToRotation(this.maze.startFacing));
    robot.setTint(getSpriteColorHex(color));
    robot.setAlpha(connected ? 1 : 0.35);
    this.robots.set(clientId, robot);
    return robot;
  }

  /** Keeps connection-status dimming current, and catches up on any player this scene didn't know about yet (e.g. dashboard mounted a beat before the roster arrived). Never removes a robot - a mid-race disconnect should stay visible, dimmed, not vanish. */
  private handlePlayersSync = (players: SpectatorPlayerInfo[]): void => {
    for (const player of players) {
      const robot = this.robots.get(player.clientId);
      if (!robot) {
        this.createRobot(player.clientId, player.color, player.connected);
        continue;
      }
      robot.setAlpha(player.connected ? 1 : 0.35);
    }
  };

  private handleOpponentStep = (clientId: string, step: RaceStep): void => {
    // A step for a player this scene hasn't seen a roster entry for
    // yet (a sync/timing edge case, not expected in normal operation)
    // still gets a robot rather than being silently dropped - default
    // color is a reasonable fallback since correctness here is purely
    // cosmetic.
    const robot = this.robots.get(clientId) ?? this.createRobot(clientId, 'blue', true);

    // Cancel whatever animation was still in flight for this robot -
    // otherwise a fast-arriving event (e.g. 'blocked' shortly after a
    // 'moved') could have its resync immediately overwritten by the
    // tail end of the previous tween, which keeps writing to the
    // robot's x/y/rotation every frame until it naturally finishes.
    // A new event always fully supersedes whatever was happening
    // before it.
    this.tweens.killTweensOf(robot);

    // Every branch below sets an ABSOLUTE target (from the step's own
    // position/facing), never a relative offset from wherever this
    // robot currently happens to be rendered. That's deliberate: this
    // scene has no way to verify a rendered robot is actually where
    // the student's own (authoritative) RaceScene says it is between
    // events, so every single event is treated as a full resync
    // opportunity, not just a delta. A previous version only did this
    // for 'moved' and left 'blocked' as a relative bump off the
    // robot's current rendered x - if anything ever nudged that
    // rendered position even slightly (a missed event, overlapping
    // tweens, network hiccup), the mismatch had no way to correct
    // itself until the next successful move, which could be a while
    // if the student kept hitting walls or just turning in the
    // meantime. Full resync on every event closes that off entirely.
    switch (step.action) {
      case 'moved': {
        const pixel = gridToPixel(step.position);
        this.tweens.add({
          targets: robot,
          x: pixel.x,
          y: pixel.y,
          rotation: facingToRotation(step.facing),
          duration: 300,
          ease: 'Sine.easeInOut',
        });
        break;
      }
      case 'turned': {
        this.tweens.add({ targets: robot, rotation: facingToRotation(step.facing), duration: 200 });
        break;
      }
      case 'blocked': {
        const pixel = gridToPixel(step.position);
        robot.setPosition(pixel.x, pixel.y);
        robot.setRotation(facingToRotation(step.facing));
        // Visual bump on top of the resync above - purely cosmetic
        // feedback that something went wrong, not a positioning
        // mechanism. There's nothing to gate here (unlike the
        // student's own 1.5s penalty) - this is a spectator view,
        // not an execution pipeline.
        const originX = robot.x;
        this.tweens.add({ targets: robot, x: originX + 4, duration: 60, yoyo: true, repeat: 3 });
        break;
      }
      case 'finished': {
        const pixel = gridToPixel(step.position);
        robot.setPosition(pixel.x, pixel.y);
        robot.setRotation(facingToRotation(step.facing));
        this.tweens.add({ targets: robot, scale: 1.4, duration: 200, yoyo: true, repeat: 1 });
        break;
      }
      case 'sensor':
        // Never actually arrives here - useRaceProgressReporting
        // filters sensor checks out before they're sent, since a
        // condition check isn't a robot action there's anything to
        // render for. Handled explicitly anyway so this switch stays
        // exhaustive rather than silently ignoring an unhandled case.
        break;
    }
  };
}
