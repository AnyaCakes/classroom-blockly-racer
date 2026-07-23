/**
 * Placeholder "sprites" - just a fixed set of colors for now. When
 * real robot art replaces this (see Tier 1 in the graphics plan),
 * only this file and the texture-loading code need to change; every
 * call site just deals with a SpriteColorId string.
 */
export const SPRITE_COLORS = [
  { id: 'red', label: 'Red', hex: 0xe53935 },
  { id: 'blue', label: 'Blue', hex: 0x1e88e5 },
  { id: 'green', label: 'Green', hex: 0x43a047 },
  { id: 'yellow', label: 'Yellow', hex: 0xfdd835 },
  { id: 'purple', label: 'Purple', hex: 0x8e24aa },
  { id: 'orange', label: 'Orange', hex: 0xfb8c00 },
] as const;

export type SpriteColorId = (typeof SPRITE_COLORS)[number]['id'];

export function getSpriteColorHex(id: SpriteColorId): number {
  const match = SPRITE_COLORS.find((c) => c.id === id);
  // Falls back to the first palette color rather than throwing -
  // a bad/missing id shouldn't crash rendering over a cosmetic issue.
  return match?.hex ?? SPRITE_COLORS[0].hex;
}

export const DEFAULT_SPRITE_COLOR: SpriteColorId = SPRITE_COLORS[0].id;
