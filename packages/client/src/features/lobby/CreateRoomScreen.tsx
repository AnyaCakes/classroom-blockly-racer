import { useEffect } from 'react';

interface Props {
  onCreate: () => void;
}

/**
 * Fires createRoom once on mount rather than requiring a button click -
 * a teacher choosing "I'm the teacher" has already expressed intent.
 * App.tsx unmounts this screen (switches to LobbyScreen) as soon as
 * room state arrives, so there's no risk of firing twice.
 */
export function CreateRoomScreen({ onCreate }: Props) {
  useEffect(() => {
    onCreate();
    // Intentionally empty - fire exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <p>Creating your room...</p>;
}
