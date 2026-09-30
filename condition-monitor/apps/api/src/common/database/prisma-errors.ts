import { Prisma } from '../../generated/prisma/client';

/**
 * Prisma error codes the API turns into HTTP answers. The database is the authority on
 * these rules: checking first and writing after would leave a gap where a concurrent
 * request could slip in, so the API writes and translates the refusal.
 */
const UNIQUE_VIOLATION = 'P2002';
const FOREIGN_KEY_VIOLATION = 'P2003';
const RECORD_NOT_FOUND = 'P2025';

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export const isUniqueViolation = (error: unknown) => hasCode(error, UNIQUE_VIOLATION);
export const isForeignKeyViolation = (error: unknown) => hasCode(error, FOREIGN_KEY_VIOLATION);
export const isRecordNotFound = (error: unknown) => hasCode(error, RECORD_NOT_FOUND);
