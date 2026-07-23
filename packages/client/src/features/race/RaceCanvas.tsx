import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import type { MazeDefinition, SpriteColorId } from '@racer/shared';
import { RaceScene, RACE_SCENE_KEY } from '../../phaser/RaceScene.js';
import { mazePixelDimensions } from '../../phaser/gridToPixel.js';

interface Props {
  maze: MazeDefinition;
  /** Shared with DebugControls so button clicks can emit `command:*` events the scene listens for. */
  bridge: Phaser.Events.EventEmitter;
  /** This client's chosen robot color; undefined for the teacher (who has no robot of their own). */
  robotColor?: SpriteColorId;
}

/**
 * Owns the Phaser Game instance for exactly the lifetime of this
 * component. React never re-renders into the canvas - all runtime
 * communication goes through `bridge`, not props/state changes,
 * because Phaser's scene graph and React's virtual DOM don't mix
 * well if you try to make Phaser objects React-controlled.
 */
export function RaceCanvas({ maze, bridge, robotColor }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const { width, height } = mazePixelDimensions(maze.width, maze.height);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      width,
      height,
      backgroundColor: '#e8e6df',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: RaceScene,
    });

    // Set before the scene's create() runs - Phaser processes the
    // initial scene on the next tick after construction, so this is
    // not a race condition, just an ordering requirement.
    game.registry.set('maze', maze);
    game.registry.set('bridge', bridge);
    if (robotColor) game.registry.set('robotColor', robotColor);

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // Intentionally only on mount/unmount - a mid-race maze swap
    // isn't a supported flow yet (there's no "change maze" event),
    // so re-running this for maze/bridge identity churn would only
    // mask bugs rather than handle a real use case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} style={{ width: '100%', maxWidth: 640 }} data-scene={RACE_SCENE_KEY} />;
}
