import { useState, type FormEvent } from 'react';
import { DEFAULT_SPRITE_COLOR, SPRITE_COLORS, type SpriteColorId } from '@racer/shared';

interface Props {
  onJoin: (roomCode: string, nickname: string, color: SpriteColorId) => void;
  error: string | null;
}

export function JoinRoomScreen({ onJoin, error }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [color, setColor] = useState<SpriteColorId>(DEFAULT_SPRITE_COLOR);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !nickname.trim()) return;
    onJoin(roomCode, nickname, color);
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

        <fieldset style={{ border: 'none', padding: 0, marginTop: '0.75rem' }}>
          <legend style={{ marginBottom: '0.25rem' }}>Pick your robot color</legend>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SPRITE_COLORS.map((option) => {
              const hex = `#${option.hex.toString(16).padStart(6, '0')}`;
              const selected = option.id === color;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setColor(option.id)}
                  aria-pressed={selected}
                  aria-label={option.label}
                  title={option.label}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: hex,
                    border: selected ? '3px solid #222' : '2px solid #ccc',
                    cursor: 'pointer',
                  }}
                />
              );
            })}
          </div>
        </fieldset>

        <button type="submit" style={{ marginTop: '1rem' }}>
          Join
        </button>
      </form>
      {error && <p role="alert" style={{ color: 'crimson' }}>{error}</p>}
    </section>
  );
}
