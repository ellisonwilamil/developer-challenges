import bcrypt from 'bcryptjs';

/**
 * bcrypt work factor (assumption A1). Each step doubles the cost of a hash; 12 keeps a
 * login well under the 350 ms budget while making offline guessing expensive.
 */
export const BCRYPT_COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
