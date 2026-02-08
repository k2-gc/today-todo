/**
 * Simply generates a UUID string.
 */

export function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
