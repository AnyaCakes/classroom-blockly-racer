import { useEffect, useState } from 'react';
import type Phaser from 'phaser';
import type { RaceStep } from '@racer/shared';

interface Props {
  bridge: Phaser.Events.EventEmitter;
}

/**
 * Milestone 3 only. Deleted once Blockly + the real interpreter
 * (Milestone 4) can drive `command:*` events instead of button
 * clicks - the scene doesn't know or care which one is calling it.
 */
export function DebugControls({ bridge }: Props) {
  const [lastStep, setLastStep] = useState<RaceStep | null>(null);

  useEffect(() => {
    const onResult = (step: RaceStep) => setLastStep(step);
    bridge.on('result:step', onResult);
    return () => {
      bridge.off('result:step', onResult);
    };
  }, [bridge]);

  return (
    <div style={{ marginTop: '1rem' }}>
      <p style={{ fontSize: '0.85rem', color: '#666' }}>
        Debug controls (Milestone 3 only - removed once Blockly drives this in Milestone 4)
      </p>
      <button onClick={() => bridge.emit('command:turnLeft')}>⟲ Turn Left</button>
      <button onClick={() => bridge.emit('command:moveForward')} style={{ margin: '0 0.5rem' }}>
        ↑ Move Forward
      </button>
      <button onClick={() => bridge.emit('command:turnRight')}>⟳ Turn Right</button>
      {lastStep && (
        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Last result: <code>{describeStep(lastStep)}</code>
        </p>
      )}
    </div>
  );
}

function describeStep(step: RaceStep): string {
  switch (step.action) {
    case 'moved':
      return `moved to (${step.position.x}, ${step.position.y})`;
    case 'turned':
      return `turned to face ${step.facing}`;
    case 'blocked':
      return `blocked by ${step.reason} at (${step.position.x}, ${step.position.y})`;
    case 'finished':
      return 'reached the goal!';
  }
}
