import type { GridPosition } from '@racer/shared';

export const TILE_SIZE = 64;

export function gridToPixel(pos: GridPosition): { x: number; y: number } {
  return {
    x: pos.x * TILE_SIZE + TILE_SIZE / 2,
    y: pos.y * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function mazePixelDimensions(width: number, height: number): { width: number; height: number } {
  return { width: width * TILE_SIZE, height: height * TILE_SIZE };
}

/** Phaser rotation is in radians, clockwise from "facing right" (East). */
export function facingToRotation(facing: 'N' | 'E' | 'S' | 'W'): number {
  switch (facing) {
    case 'E':
      return 0;
    case 'S':
      return Math.PI / 2;
    case 'W':
      return Math.PI;
    case 'N':
      return -Math.PI / 2;
  }
}
