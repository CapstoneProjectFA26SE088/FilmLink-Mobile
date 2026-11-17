import { ApiError, createNetworkProblem, toProblemDetail } from '@/shared/lib';
import type { FetchFn, TokenProvider } from './http';
import {
  type AuthSession,
  type SessionStorage,
  sessionFromTokenResponse,
  TokenResponseSchema,
} from './session';
import { createSingleFlight } from './single-flight';

export const REFRESH_PATH = '/auth/refresh';

export type SessionEndReason = 'signed-out' | 'refresh-rejected' | 'unsupported-role';

export type SessionListener = (session: AuthSession | null, reason?: SessionEndReason) => void;

export type SessionManager = TokenProvider & {
  readonly hydrate: () => Promise<AuthSession | null>;
  readonly getSession: () => AuthSession | null;
  readonly saveSession: (session: AuthSession) => Promise<void>;
  readonly endSession: (reason?: SessionEndReason) => Promise<void>;
  readonly subscribe: (listener: SessionListener) => () => void;
};

export type SessionManagerOptions = {
  readonly baseUrl: string;
  readonly storage: SessionStorage;
  readonly fetchFn?: FetchFn;
  readonly now?: () => number;
};

function refreshUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${REFRESH_PATH}`;
}

async function readJson(response: Response): Promise<unknown> {
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

export function createSessionManager({
  baseUrl,
  storage,
  fetchFn = (input, init) => fetch(input, init),
  now = () => Date.now(),
}: SessionManagerOptions): SessionManager {
  let session: AuthSession | null = null;
  let hydrated = false;
  const listeners = new Set<SessionListener>();

  const notify = (reason?: SessionEndReason) => {
    for (const listener of listeners) {
      listener(session, reason);
    }
  };

  const ensureHydrated = async (): Promise<AuthSession | null> => {
    if (!hydrated) {
      session = await storage.read();
      hydrated = true;
    }
    return session;
  };

  const saveSession = async (next: AuthSession) => {
    session = next;
    hydrated = true;
    await storage.write(next);
    notify();
  };

  const endSession = async (reason: SessionEndReason = 'signed-out') => {
    session = null;
    hydrated = true;
    await storage.clear().catch(() => undefined);
    notify(reason);
  };

  const performRefresh = async (): Promise<string | null> => {
    const current = await ensureHydrated();
    if (!current) {
      return null;
    }
    const url = refreshUrl(baseUrl);
    let response: Response;
    try {
      response = await fetchFn(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
    } catch {
      throw new ApiError(createNetworkProblem(), url);
    }
    const body = await readJson(response);
    if (!response.ok) {
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        await endSession('refresh-rejected');
        return null;
      }
      throw new ApiError(toProblemDetail(body, response.status), url);
    }
    const tokens = TokenResponseSchema.safeParse(body);
    const next = tokens.success ? sessionFromTokenResponse(tokens.data, now()) : null;
    if (!next) {
      await endSession('unsupported-role');
      return null;
    }
    await saveSession(next);
    return next.accessToken;
  };

  const refreshFlight = createSingleFlight(performRefresh);

  return {
    hydrate: ensureHydrated,
    getSession: () => session,
    saveSession,
    endSession,
    getAccessToken: async () => (await ensureHydrated())?.accessToken ?? null,
    refreshAccessToken: refreshFlight.run,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
