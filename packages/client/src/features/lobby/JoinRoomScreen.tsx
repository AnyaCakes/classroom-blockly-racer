import { useState, type FormEvent } from 'react';

interface Props {
  onJoin: (roomCode: string, nickname: string) => void;
  error: string | null;
}

export function JoinRoomScreen({ onJoin, error }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim()) return;
    onJoin(roomCode, nickname);
  };

  return (
    <section>
      <h2>Join a race</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Room code
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={4}
            placeholder="e.g. RK4X"
            autoFocus
          />
        </label>
        <label>
          Your nickname
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            placeholder="e.g. Alex"
          />
        </label>
        <button type="submit">Join</button>
      </form>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
    </section>
  );
}
