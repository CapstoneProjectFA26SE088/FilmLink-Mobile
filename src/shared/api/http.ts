import { Platform } from 'react-native';
import { z } from 'zod';
import { ApiError, createNetworkProblem, toProblemDetail } from '@/shared/lib';

export const NoContentSchema = z.unknown().transform((): undefined => undefined);

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export type TokenProvider = {
  readonly getAccessToken: () => Promise<string | null>;
  readonly refreshAccessToken: () => Promise<string | null>;
};

export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | null | undefined | readonly QueryPrimitive[];
export type QueryParams = Readonly<Record<string, QueryValue>>;

export type RequestConfig = {
  readonly query?: QueryParams;
  readonly auth?: boolean;
  readonly signal?: AbortSignal;
  readonly headers?: Readonly<Record<string, string>>;
};

export type MultipartFile = {
  readonly field: string;
  readonly uri: string;
  readonly name: string;
  readonly type: string;
};

export type MultipartParts = {
  readonly data?: unknown;
  readonly files?: readonly MultipartFile[];
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpClientOptions = {
  readonly baseUrl: string;
  readonly fetchFn?: FetchFn;
  readonly tokenProvider?: TokenProvider;
  readonly platform?: string;
};

export type HttpClient = {
  readonly get: <S extends z.ZodType>(
    path: string,
    schema: S,
    config?: RequestConfig,
  ) => Promise<z.infer<S>>;
  readonly post: <S extends z.ZodType>(
    path: string,
    body: unknown,
    schema: S,
    config?: RequestConfig,
  ) => Promise<z.infer<S>>;
  readonly put: <S extends z.ZodType>(
    path: string,
    body: unknown,
    schema: S,
    config?: RequestConfig,
  ) => Promise<z.infer<S>>;
  readonly patch: <S extends z.ZodType>(
    path: string,
    body: unknown,
    schema: S,
    config?: RequestConfig,
  ) => Promise<z.infer<S>>;
  readonly del: <S extends z.ZodType>(
    path: string,
    schema: S,
    config?: RequestConfig,
  ) => Promise<z.infer<S>>;
  readonly multipartPost: <S extends z.ZodType>(
    path: string,
    parts: MultipartParts,
    schema: S,
    config?: RequestConfig,
  ) => Promise<z.infer<S>>;
};

export class ResponseShapeError extends Error {
  override readonly name = 'ResponseShapeError';
  readonly url: string;
  readonly issues: readonly string[];

  constructor(url: string, issues: readonly string[] = []) {
    super(`Unexpected response shape from ${url}`);
    this.url = url;
    this.issues = issues;
  }
}

export function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export function buildQueryString(params: QueryParams | undefined): string {
  if (!params) {
    return '';
  }
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }
    const values: readonly QueryPrimitive[] = Array.isArray(value)
      ? value
      : [value as QueryPrimitive];
    for (const item of values) {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
    }
  }
  return pairs.length > 0 ? `?${pairs.join('&')}` : '';
}

export function buildMultipartFormData(
  parts: MultipartParts,
  platform: string = Platform.OS,
): FormData {
  const formData = new FormData();
  if (parts.data !== undefined) {
    const json = JSON.stringify(parts.data);
    const jsonPart =
      platform === 'web'
        ? new Blob([json], { type: 'application/json' })
        : ({ string: json, type: 'application/json' } as unknown as Blob);
    formData.append('data', jsonPart);
  }
  for (const file of parts.files ?? []) {
    formData.append(file.field, {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);
  }
  return formData;
}

type BodyPayload =
  | { readonly kind: 'none' }
  | { readonly kind: 'json'; readonly value: unknown }
  | { readonly kind: 'multipart'; readonly parts: MultipartParts };

async function readBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function createHttpClient({
  baseUrl,
  fetchFn = (input, init) => fetch(input, init),
  tokenProvider,
  platform = Platform.OS,
}: HttpClientOptions): HttpClient {
  const buildInit = async (
    method: HttpMethod,
    payload: BodyPayload,
    config: RequestConfig,
    useAuth: boolean,
  ): Promise<RequestInit> => {
    const headers: Record<string, string> = { Accept: 'application/json', ...config.headers };
    let body: BodyInit | undefined;
    if (payload.kind === 'json') {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(payload.value);
    } else if (payload.kind === 'multipart') {
      body = buildMultipartFormData(payload.parts, platform);
    }
    if (useAuth && tokenProvider) {
      const token = await tokenProvider.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return { method, headers, body, signal: config.signal };
  };

  const send = async (url: string, init: RequestInit): Promise<Response> => {
    try {
      return await fetchFn(url, init);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw new ApiError(createNetworkProblem(), url);
    }
  };

  const request = async <S extends z.ZodType>(
    method: HttpMethod,
    path: string,
    payload: BodyPayload,
    schema: S,
    config: RequestConfig = {},
  ): Promise<z.infer<S>> => {
    const url = `${joinUrl(baseUrl, path)}${buildQueryString(config.query)}`;
    const useAuth = config.auth !== false && tokenProvider !== undefined;
    let response = await send(url, await buildInit(method, payload, config, useAuth));

    if (response.status === 401 && useAuth && tokenProvider) {
      const refreshed = await tokenProvider.refreshAccessToken();
      if (refreshed) {
        response = await send(url, await buildInit(method, payload, config, useAuth));
      }
    }

    const body = await readBody(response);
    if (!response.ok) {
      throw new ApiError(toProblemDetail(body, response.status), url);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new ResponseShapeError(
        url,
        parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
      );
    }
    return parsed.data;
  };

  return {
    get: (path, schema, config) => request('GET', path, { kind: 'none' }, schema, config),
    post: (path, body, schema, config) =>
      request('POST', path, { kind: 'json', value: body }, schema, config),
    put: (path, body, schema, config) =>
      request('PUT', path, { kind: 'json', value: body }, schema, config),
    patch: (path, body, schema, config) =>
      request('PATCH', path, { kind: 'json', value: body }, schema, config),
    del: (path, schema, config) => request('DELETE', path, { kind: 'none' }, schema, config),
    multipartPost: (path, parts, schema, config) =>
      request('POST', path, { kind: 'multipart', parts }, schema, config),
  };
}
