const STORAGE_KEY = 'racer:clientId';

/**
 * Returns a stable id for this browser tab, generating and persisting
 * one to sessionStorage on first use. Deliberately sessionStorage
 * (not localStorage): a genuinely new tab should be a new identity,
 * but a refresh of the *same* tab should reconnect as the same
 * player rather than joining twice.
 */
export function getOrCreateClientId(): string {
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const generated = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, generated);
  return generated;
}
