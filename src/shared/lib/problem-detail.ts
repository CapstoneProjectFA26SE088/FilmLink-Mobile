import { ZodError } from 'zod';

export type ProblemFieldError = {
  readonly field: string;
  readonly message: string;
};

export type ArchiveIncompleteRollInfo = {
  readonly filmRollId: number;
  readonly rollSequence: number;
  readonly missingPreviewScan: boolean;
  readonly missingFullResolutionLink: boolean;
};

export type ProblemDetail = {
  readonly type?: string;
  readonly title?: string;
  readonly status: number;
  readonly detail: string;
  readonly instance?: string;
  readonly errorCode?: string;
  readonly messageCode?: string;
  readonly errors?: readonly ProblemFieldError[];
  readonly lockReason?: string;
  readonly currentVersion?: number;
  readonly submittedVersion?: number;
  readonly limit?: number;
  readonly missing?: readonly string[];
  readonly incompleteRolls?: readonly ArchiveIncompleteRollInfo[];
  readonly proposedPromisedReturnAt?: string;
  readonly currentStage?: string;
  readonly expectedStage?: string;
  readonly missingFilmRollIds?: readonly number[];
  readonly duplicateFilmRollIds?: readonly number[];
  readonly unknownFilmRollIds?: readonly number[];
  readonly field?: string;
  readonly value?: string;
  readonly position?: number;
  readonly min?: number;
  readonly max?: number;
};

export type ApiProblemDetail = ProblemDetail;

export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';
export const NETWORK_ERROR_STATUS = 0;
export const DEFAULT_NETWORK_MESSAGE = 'Không thể kết nối tới máy chủ FilmLink.';
export const DEFAULT_ERROR_MESSAGE = 'Đã có lỗi xảy ra. Vui lòng thử lại.';

const NETWORK_MESSAGE_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /network ?error/i,
  /load failed/i,
  /timed? ?out/i,
];

export class ApiError extends Error {
  override readonly name = 'ApiError';
  readonly problem: ProblemDetail;
  readonly url: string;

  constructor(problem: ProblemDetail, url: string) {
    super(problem.detail);
    this.problem = problem;
    this.url = url;
  }

  get status(): number {
    return this.problem.status;
  }

  get errorCode(): string | undefined {
    return this.problem.errorCode;
  }
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  if (!value || typeof value !== 'object' || value instanceof Error) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return typeof candidate.status === 'number' && typeof candidate.detail === 'string';
}

function readOptionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readOptionalNumber(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readOptionalStringArray(
  record: Record<string, unknown>,
  key: string,
): readonly string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : undefined;
}

function readOptionalNumberArray(
  record: Record<string, unknown>,
  key: string,
): readonly number[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.filter((item): item is number => typeof item === 'number');
  return items.length > 0 ? items : undefined;
}

function readIncompleteRolls(value: unknown): readonly ArchiveIncompleteRollInfo[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value.flatMap((item): ArchiveIncompleteRollInfo[] => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const r = item as Record<string, unknown>;
    if (typeof r.filmRollId !== 'number' || typeof r.rollSequence !== 'number') {
      return [];
    }
    return [
      {
        filmRollId: r.filmRollId,
        rollSequence: r.rollSequence,
        missingPreviewScan: Boolean(r.missingPreviewScan),
        missingFullResolutionLink: Boolean(r.missingFullResolutionLink),
      },
    ];
  });
  return items.length > 0 ? items : undefined;
}

export function parseFieldErrors(value: unknown): readonly ProblemFieldError[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const errors = value.flatMap((item): ProblemFieldError[] => {
    if (!item || typeof item !== 'object') {
      return [];
    }
    const record = item as Record<string, unknown>;
    if (typeof record.field !== 'string' || typeof record.message !== 'string') {
      return [];
    }
    return [{ field: record.field, message: record.message }];
  });
  return errors.length > 0 ? errors : undefined;
}

function compactProblem(problem: ProblemDetail): ProblemDetail {
  return Object.fromEntries(
    Object.entries(problem).filter(([, value]) => value !== undefined),
  ) as ProblemDetail;
}

export function toProblemDetail(
  body: unknown,
  status: number,
  fallbackMessage = DEFAULT_ERROR_MESSAGE,
): ProblemDetail {
  const record =
    body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  return compactProblem({
    type: readOptionalString(record, 'type'),
    title: readOptionalString(record, 'title'),
    status: typeof record.status === 'number' ? record.status : status,
    detail:
      readOptionalString(record, 'detail') ??
      readOptionalString(record, 'message') ??
      readOptionalString(record, 'title') ??
      fallbackMessage,
    instance: readOptionalString(record, 'instance'),
    errorCode: readOptionalString(record, 'errorCode') ?? `HTTP_${status}`,
    messageCode: readOptionalString(record, 'messageCode'),
    errors: parseFieldErrors(record.errors),
    lockReason: readOptionalString(record, 'lockReason'),
    currentVersion: readOptionalNumber(record, 'currentVersion'),
    submittedVersion: readOptionalNumber(record, 'submittedVersion'),
    limit: readOptionalNumber(record, 'limit'),
    missing: readOptionalStringArray(record, 'missing'),
    incompleteRolls: readIncompleteRolls(record.incompleteRolls),
    proposedPromisedReturnAt: readOptionalString(record, 'proposedPromisedReturnAt'),
    currentStage: readOptionalString(record, 'currentStage'),
    expectedStage: readOptionalString(record, 'expectedStage'),
    missingFilmRollIds: readOptionalNumberArray(record, 'missingFilmRollIds'),
    duplicateFilmRollIds: readOptionalNumberArray(record, 'duplicateFilmRollIds'),
    unknownFilmRollIds: readOptionalNumberArray(record, 'unknownFilmRollIds'),
    field: readOptionalString(record, 'field'),
    value: readOptionalString(record, 'value'),
    position: readOptionalNumber(record, 'position'),
    min: readOptionalNumber(record, 'min'),
    max: readOptionalNumber(record, 'max'),
  });
}

export function createNetworkProblem(detail = DEFAULT_NETWORK_MESSAGE): ProblemDetail {
  return { status: NETWORK_ERROR_STATUS, detail, errorCode: NETWORK_ERROR_CODE };
}

function looksLikeNetworkFailure(error: Error): boolean {
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    return true;
  }
  return NETWORK_MESSAGE_PATTERNS.some((pattern) => pattern.test(error.message));
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.problem.errorCode === NETWORK_ERROR_CODE;
  }
  if (isProblemDetail(error)) {
    return error.errorCode === NETWORK_ERROR_CODE || error.status === NETWORK_ERROR_STATUS;
  }
  if (error instanceof Error) {
    return looksLikeNetworkFailure(error);
  }
  return false;
}

function normalizeRecordError(
  record: Record<string, unknown>,
  fallbackMessage: string,
): ProblemDetail {
  const detail =
    typeof record.detail === 'string'
      ? record.detail
      : typeof record.message === 'string'
        ? record.message
        : fallbackMessage;
  return {
    status: typeof record.status === 'number' ? record.status : 500,
    detail,
    errorCode: typeof record.errorCode === 'string' ? record.errorCode : 'NETWORK_OR_SERVER_ERROR',
    messageCode: typeof record.messageCode === 'string' ? record.messageCode : undefined,
  };
}

function normalizeZodError(error: ZodError, fallbackMessage: string): ProblemDetail {
  const errors: ProblemFieldError[] = error.issues
    .filter((issue) => issue.message.length > 0)
    .map((issue) => ({
      field: issue.path[0] !== undefined ? String(issue.path[0]) : 'form',
      message: issue.message,
    }));
  return {
    status: 400,
    detail: errors[0]?.message ?? fallbackMessage,
    errorCode: 'CLIENT_VALIDATION_ERROR',
    errors: errors.length > 0 ? errors : undefined,
  };
}

export function normalizeProblemDetail(
  error: unknown,
  fallbackMessage = DEFAULT_NETWORK_MESSAGE,
): ProblemDetail {
  if (error instanceof ApiError) {
    return error.problem;
  }

  if (isProblemDetail(error)) {
    return error;
  }

  if (error instanceof ZodError) {
    return normalizeZodError(error, fallbackMessage);
  }

  if (error instanceof Error) {
    if (looksLikeNetworkFailure(error)) {
      return createNetworkProblem(fallbackMessage);
    }
    return {
      status: 400,
      detail: error.message || fallbackMessage,
      errorCode: 'CLIENT_VALIDATION_ERROR',
    };
  }

  if (error && typeof error === 'object') {
    return normalizeRecordError(error as Record<string, unknown>, fallbackMessage);
  }

  return {
    status: 500,
    detail: fallbackMessage,
    errorCode: 'UNKNOWN_ERROR',
  };
}

export function getErrorMessage(error: unknown, fallbackMessage = DEFAULT_ERROR_MESSAGE): string {
  return normalizeProblemDetail(error, fallbackMessage).detail;
}

export function getFieldErrors(error: unknown): Readonly<Record<string, string>> {
  const errors = normalizeProblemDetail(error).errors ?? [];
  const result: Record<string, string> = {};
  for (const { field, message } of errors) {
    if (!(field in result)) {
      result[field] = message;
    }
  }
  return result;
}

export function hasErrorCode(error: unknown, errorCode: string): boolean {
  return normalizeProblemDetail(error).errorCode === errorCode;
}
