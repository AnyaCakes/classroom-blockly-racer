import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import type { MazeDefinition } from '@racer/shared';
import { SpectatorScene, SPECTATOR_SCENE_KEY, type SpectatorPlayerInfo } from '../../phaser/SpectatorScene.js';
import { mazePixelDimensions } from '../../phaser/gridToPixel.js';

interface Props {
  maze: MazeDefinition;
  bridge: Phaser.Events.EventEmitter;
  /** Initial roster snapshot - later updates flow through `bridge` (see useOpponentProgress), not through re-rendering this prop. */
  initialPlayers: SpectatorPlayerInfo[];
}

export function TeacherDashboardCanvas({ maze, bridge, initialPlayers }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  // See RaceCanvas.tsx for why this is computed here (not just
  // inside the effect) and used for the container's aspect-ratio CSS.
  const { width, height } = mazePixelDimensions(maze.width, maze.height);

  useEffect(() => {
    if (!containerRef.current) return;

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
      scene: SpectatorScene,
    });

    game.registry.set('maze', maze);
    game.registry.set('bridge', bridge);
    game.registry.set('players', initialPlayers);

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // Mount/unmount only, same reasoning as RaceCanvas - initialPlayers
    // is a snapshot for scene creation, not a prop this re-syncs on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', maxWidth: 900, aspectRatio: `${width} / ${height}` }}
      data-scene={SPECTATOR_SCENE_KEY}
    />
  );
}
