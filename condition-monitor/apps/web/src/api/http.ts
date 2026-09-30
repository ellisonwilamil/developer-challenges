/**
 * Error answered by the API, carrying its Problem Details body (API contract, "Errors").
 * `problem` is null when the response was not Problem Details, such as a proxy error.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails | null,
  ) {
    super(problem?.detail ?? `Request failed with status ${status}.`);
    this.name = 'ApiError';
  }
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  errors?: Record<string, unknown>[];
}

/**
 * Every API call goes through here. The API is reached under `/api` on the same origin:
 * the Vite dev server proxies it, so the session cookie is sent (ADR 0008).
 */
export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readProblem(response));
  }
  return (await response.json()) as T;
}

async function readProblem(response: Response): Promise<ProblemDetails | null> {
  if (!response.headers.get('content-type')?.includes('application/problem+json')) {
    return null;
  }
  return (await response.json()) as ProblemDetails;
}
