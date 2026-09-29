import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';
import { GENERIC_PROBLEM_TYPE, PROBLEM_CONTENT_TYPE, type ProblemDetails } from './problem-details';
import { ProblemException } from './problem.exception';

/**
 * Turns every error into a Problem Details body, in one place (architecture, "Inside the
 * API"). Unexpected errors become a generic 500: the stack goes to the log, never to the
 * client.
 */
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const problem = this.toProblem(exception);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(problem.status)
      .type(PROBLEM_CONTENT_TYPE)
      .json(problem);
  }

  private toProblem(exception: unknown): ProblemDetails {
    if (exception instanceof ProblemException) {
      return exception.problem;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        type: GENERIC_PROBLEM_TYPE,
        title: STATUS_CODES[status] ?? 'Error',
        status,
        detail: exception.message,
      };
    }
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return {
      type: GENERIC_PROBLEM_TYPE,
      title: STATUS_CODES[HttpStatus.INTERNAL_SERVER_ERROR] ?? 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: 'An unexpected error occurred.',
    };
  }
}
