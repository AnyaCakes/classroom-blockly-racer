import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

type HealthState = 'checking' | 'ok' | 'unreachable';

export function App() {
  const { connected } = useSocket();
  const [health, setHealth] = useState<HealthState>('checking');

  useEffect(() => {
    fetch(`${SERVER_URL}/health`)
      .then((res) => (res.ok ? setHealth('ok') : setHealth('unreachable')))
      .catch(() => setHealth('unreachable'));
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Classroom Blockly Racer</h1>
      <p>Milestone 1 — scaffolding check.</p>
      <ul>
        <li>HTTP health check: <strong>{health}</strong></li>
        <li>Socket.io connection: <strong>{connected ? 'connected' : 'disconnected'}</strong></li>
      </ul>
    </main>
  );
}
