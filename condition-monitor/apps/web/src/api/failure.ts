import { ApiError, fieldErrorsOf, type FieldError } from './http';

/**
 * Why a request failed, in the shape a screen shows it. Thunks reject with this value:
 * a plain thunk error would lose the API's field errors when Redux serializes it.
 */
export interface RequestFailure {
  /** HTTP status, or null when the API could not be reached. */
  status: number | null;
  message: string;
  fieldErrors: FieldError[];
}

export function toFailure(error: unknown): RequestFailure {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message, fieldErrors: fieldErrorsOf(error) };
  }
  return {
    status: null,
    message: 'Could not reach the API. Try again in a moment.',
    fieldErrors: [],
  };
}
