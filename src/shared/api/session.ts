import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { z } from 'zod';

export const SUPPORTED_MOBILE_ROLES = ['PHOTOGRAPHER', 'PHOTOGRAPHY_EXPERT'] as const;
export type SupportedMobileRole = (typeof SUPPORTED_MOBILE_ROLES)[number];

export const SESSION_STORAGE_KEY = 'filmlink.session.v1';

export const TokenResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal('Bearer').optional(),
  expiresIn: z.number().int().positive(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

export const AuthSessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  accountId: z.number().int().positive(),
  email: z.string(),
  role: z.enum(SUPPORTED_MOBILE_ROLES),
  accessTokenExpiresAt: z.string(),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

const AccessTokenClaimsSchema = z.object({
  sub: z.union([z.string(), z.number()]).transform((value) => Number(value)),
  email: z.string().default(''),
  role: z.string(),
  exp: z.number().optional(),
  iat: z.number().optional(),
});
export type AccessTokenClaims = z.infer<typeof AccessTokenClaimsSchema>;

export type SecureKeyValueStore = {
  readonly getItem: (key: string) => Promise<string | null>;
  readonly setItem: (key: string, value: string) => Promise<void>;
  readonly deleteItem: (key: string) => Promise<void>;
};

export type SessionStorage = {
  readonly read: () => Promise<AuthSession | null>;
  readonly write: (session: AuthSession) => Promise<void>;
  readonly clear: () => Promise<void>;
};

export type WebStorageLike = {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
};

export function isSupportedMobileRole(role: unknown): role is SupportedMobileRole {
  return typeof role === 'string' && (SUPPORTED_MOBILE_ROLES as readonly string[]).includes(role);
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const percentEncoded = Array.from(
    binary,
    (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`,
  ).join('');
  return decodeURIComponent(percentEncoded);
}

export function decodeAccessTokenClaims(token: string): AccessTokenClaims | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }
  try {
    const parsed = AccessTokenClaimsSchema.safeParse(JSON.parse(decodeBase64Url(payload)));
    if (!parsed.success || !Number.isInteger(parsed.data.sub) || parsed.data.sub <= 0) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function sessionFromTokenResponse(
  tokens: TokenResponse,
  now: number = Date.now(),
): AuthSession | null {
  const claims = decodeAccessTokenClaims(tokens.accessToken);
  if (!claims || !isSupportedMobileRole(claims.role)) {
    return null;
  }
  const expiresAtMs = claims.exp ? claims.exp * 1000 : now + tokens.expiresIn * 1000;
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accountId: claims.sub,
    email: claims.email,
    role: claims.role,
    accessTokenExpiresAt: new Date(expiresAtMs).toISOString(),
  };
}

export function isAccessTokenExpired(
  session: AuthSession,
  now: number = Date.now(),
  skewMs = 30_000,
): boolean {
  const expiresAt = Date.parse(session.accessTokenExpiresAt);
  return Number.isNaN(expiresAt) || expiresAt - skewMs <= now;
}

export function createSessionStorage(
  store: SecureKeyValueStore,
  key = SESSION_STORAGE_KEY,
): SessionStorage {
  return {
    read: async () => {
      const raw = await store.getItem(key).catch(() => null);
      if (!raw) {
        return null;
      }
      try {
        const parsed = AuthSessionSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          return parsed.data;
        }
      } catch {
        await store.deleteItem(key).catch(() => undefined);
        return null;
      }
      await store.deleteItem(key).catch(() => undefined);
      return null;
    },
    write: async (session) => {
      await store.setItem(key, JSON.stringify(AuthSessionSchema.parse(session)));
    },
    clear: async () => {
      await store.deleteItem(key);
    },
  };
}

export function createMemorySecureStore(
  initial: Readonly<Record<string, string>> = {},
): SecureKeyValueStore {
  const values = new Map(Object.entries(initial));
  return {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    deleteItem: async (key) => {
      values.delete(key);
    },
  };
}

export function createWebSecureStore(storage: WebStorageLike): SecureKeyValueStore {
  return {
    getItem: async (key) => storage.getItem(key),
    setItem: async (key, value) => {
      storage.setItem(key, value);
    },
    deleteItem: async (key) => {
      storage.removeItem(key);
    },
  };
}

export function createExpoSecureStore(): SecureKeyValueStore {
  const options: SecureStore.SecureStoreOptions = {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  };
  return {
    getItem: (key) => SecureStore.getItemAsync(key, options),
    setItem: (key, value) => SecureStore.setItemAsync(key, value, options),
    deleteItem: (key) => SecureStore.deleteItemAsync(key, options),
  };
}

function resolveWebStorage(): WebStorageLike | null {
  const candidate = (globalThis as { localStorage?: WebStorageLike }).localStorage;
  return candidate ?? null;
}

export function createPlatformSecureStore(
  platform: string = Platform.OS,
  webStorage: WebStorageLike | null = resolveWebStorage(),
): SecureKeyValueStore {
  if (platform !== 'web') {
    return createExpoSecureStore();
  }
  return webStorage ? createWebSecureStore(webStorage) : createMemorySecureStore();
}
