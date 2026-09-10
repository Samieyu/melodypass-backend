import * as crypto from 'crypto';

/**
 * Perform a constant-time comparison of two strings to prevent timing attacks.
 * Uses SHA-256 digests to ensure buffers are always of equal length prior to timingSafeEqual.
 */
export function safeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();

  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Generate cryptographically secure 6-character access code.
 * Excludes ambiguous characters: 0, O, 1, I, L.
 */
export function generateAccessCode(): string {
  const allowedChars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    result += allowedChars[bytes[i] % allowedChars.length];
  }
  return result;
}

/**
 * Generate cryptographically secure session token (32 bytes hex = 64 chars)
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
