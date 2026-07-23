import Phaser from 'phaser';
import { TILE_SIZE } from './gridToPixel.js';

const COLORS = {
  floor: 0xf4f1e8,
  wall: 0x3a3a4a,
  goal: 0x4caf50,
  gridLine: 0xd8d4c8,
  robotBody: 0x2f6fed,
  robotFacing: 0xffffff,
} as const;

/**
 * Draws each tile type and the robot once into reusable textures.
 * Called from RaceScene.preload() (well, actually create() - these
 * use the Graphics API which needs the scene to exist already).
 * Swap this module out for real spritesheets later without touching
 * any code that references the texture keys below.
 */
export function createPlaceholderTextures(scene: Phaser.Scene): void {
  const g = scene.add.graphics();

  drawTile(g, scene, 'tile-floor', COLORS.floor);
  drawTile(g, scene, 'tile-wall', COLORS.wall);
  drawTile(g, scene, 'tile-goal', COLORS.goal);
  drawRobot(g, scene);

  g.destroy();
}

function drawTile(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene, key: string, color: number): void {
  g.clear();
  g.fillStyle(color, 1);
  g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.lineStyle(1, COLORS.gridLine, 1);
  g.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
  g.generateTexture(key, TILE_SIZE, TILE_SIZE);
}

function drawRobot(g: Phaser.GameObjects.Graphics, scene: Phaser.Scene): void {
  const size = TILE_SIZE * 0.6;
  const offset = (TILE_SIZE - size) / 2;

  g.clear();
  g.fillStyle(COLORS.robotBody, 1);
  g.fillRoundedRect(offset, offset, size, size, 8);
  // Facing indicator: a small triangle pointing "east" (right) at
  // texture-local orientation 0 - facingToRotation() rotates the
  // whole sprite to match the robot's actual facing at runtime.
  g.fillStyle(COLORS.robotFacing, 1);
  g.fillTriangle(
    TILE_SIZE - offset - 4, TILE_SIZE / 2,
    TILE_SIZE - offset - size * 0.4, TILE_SIZE / 2 - size * 0.2,
    TILE_SIZE - offset - size * 0.4, TILE_SIZE / 2 + size * 0.2
  );
  g.generateTexture('robot', TILE_SIZE, TILE_SIZE);
}
