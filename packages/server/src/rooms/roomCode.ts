// Excludes 0/O, 1/I/L - characters a student is likely to misread or
// mistype when copying a code off a projector or whiteboard.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Generates a code guaranteed not to collide with an existing one. */
export function generateUniqueRoomCode(exists: (code: string) => boolean): string {
  let code = generateRoomCode();
  let attempts = 0;
  while (exists(code)) {
    code = generateRoomCode();
    attempts += 1;
    if (attempts > 50) {
      throw new Error('Failed to generate a unique room code after 50 attempts');
    }
  }
  return code;
}
