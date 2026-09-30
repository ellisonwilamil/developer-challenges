import { NotFoundException } from '@nestjs/common';
import { VALIDATION_PROBLEM_TYPE } from '../validation/zod-validation.pipe';
import { ProblemException } from './problem.exception';

export const CONFLICT_PROBLEM_TYPE = 'urn:condition-monitor:error:conflict';

/** The request is valid but clashes with stored data (API contract, status codes). */
export function conflict(
  title: string,
  detail: string,
  errors: Record<string, unknown>[],
): ProblemException {
  return new ProblemException({ type: CONFLICT_PROBLEM_TYPE, title, status: 409, detail, errors });
}

/**
 * A resource that does not exist or belongs to another user: the answer is the same, so
 * it never reveals what other users have (assumption A4).
 */
export function notFound(resource: string): NotFoundException {
  return new NotFoundException(`${resource} not found.`);
}

/**
 * A request that passed the schema but breaks a rule only the stored data can check, such
 * as a position that does not belong to the machine's type. Same shape as a schema error.
 */
export function invalid(errors: { field: string; message: string }[]): ProblemException {
  return new ProblemException({
    type: VALIDATION_PROBLEM_TYPE,
    title: 'Invalid request',
    status: 422,
    detail: errors.length === 1 ? '1 field is invalid.' : `${errors.length} fields are invalid.`,
    errors,
  });
}
