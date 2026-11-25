import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { z } from 'zod';

export const DRAFT_FLOW_KEYS = [
  'services_lab_selection',
  'services_booking_wizard',
  'orders_action_draft',
  'marketplace_draft',
  'community_draft',
  'expert_draft',
  'ai_advisor_draft',
  'negative_preview',
  'print_order',
] as const;

export type DraftFlowKey = (typeof DRAFT_FLOW_KEYS)[number];

export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DRAFT_DIRECTORY_NAME = 'filmlink-drafts';
export const GUEST_ACCOUNT_KEY = 'guest';

const DRAFT_FILE_PATTERN = /^[a-z0-9-]+__[a-z_]+\.json$/;
const SIGNED_URL_PATTERN = /\/files\?[^"\s]*signature=/i;

export type DraftEnvelope<T> = {
  readonly schemaVersion: typeof DRAFT_SCHEMA_VERSION;
  readonly accountKey: string;
  readonly flowKey: DraftFlowKey;
  readonly idempotencyKey: string;
  readonly payload: T;
  readonly lastErrorDetail: string | null;
  readonly updatedAt: string;
};

const EnvelopeShapeSchema = z.object({
  schemaVersion: z.literal(DRAFT_SCHEMA_VERSION),
  accountKey: z.string().min(1),
  flowKey: z.enum(DRAFT_FLOW_KEYS),
  idempotencyKey: z.string().min(1),
  payload: z.unknown(),
  lastErrorDetail: z.string().nullable().default(null),
  updatedAt: z.iso.datetime(),
});

export type DraftFileAdapter = {
  readonly read: (fileName: string) => Promise<string | null>;
  readonly writeAtomic: (fileName: string, content: string) => Promise<void>;
  readonly remove: (fileName: string) => Promise<void>;
  readonly list: () => Promise<readonly string[]>;
};

export type DraftSaveInput<T> = {
  readonly accountKey: string;
  readonly flowKey: DraftFlowKey;
  readonly idempotencyKey: string;
  readonly payload: T;
  readonly lastErrorDetail?: string | null;
};

export type DraftStorage = {
  readonly load: <T>(
    accountKey: string,
    flowKey: DraftFlowKey,
    payloadSchema: z.ZodType<T>,
  ) => Promise<DraftEnvelope<T> | null>;
  readonly save: <T>(input: DraftSaveInput<T>) => Promise<DraftEnvelope<T>>;
  readonly remove: (accountKey: string, flowKey: DraftFlowKey) => Promise<void>;
  readonly purgeExpired: () => Promise<number>;
};

export type DraftStorageOptions = {
  readonly now?: () => number;
  readonly ttlMs?: number;
};

export class DraftSecretError extends Error {
  override readonly name = 'DraftSecretError';
}

export function toDraftAccountKey(accountId: number | string | null | undefined): string {
  if (accountId === null || accountId === undefined || accountId === '') {
    return GUEST_ACCOUNT_KEY;
  }
  const normalized = String(accountId)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');
  return normalized.length > 0 ? normalized : GUEST_ACCOUNT_KEY;
}

export function draftFileName(accountKey: string, flowKey: DraftFlowKey): string {
  return `${toDraftAccountKey(accountKey)}__${flowKey}.json`;
}

export function isDraftFileName(fileName: string): boolean {
  return DRAFT_FILE_PATTERN.test(fileName);
}

export function containsSignedUrl(content: string): boolean {
  return SIGNED_URL_PATTERN.test(content);
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  const cryptoSource = (globalThis as { crypto?: { getRandomValues?: (a: Uint8Array) => void } })
    .crypto;
  if (cryptoSource?.getRandomValues) {
    cryptoSource.getRandomValues(bytes);
    return bytes;
  }
  for (let index = 0; index < length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function createIdempotencyKey(): string {
  const bytes = randomBytes(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isExpired(updatedAt: string, now: number, ttlMs: number): boolean {
  const timestamp = Date.parse(updatedAt);
  return Number.isNaN(timestamp) || now - timestamp > ttlMs;
}

export function createDraftStorage(
  adapter: DraftFileAdapter,
  { now = () => Date.now(), ttlMs = DRAFT_TTL_MS }: DraftStorageOptions = {},
): DraftStorage {
  const discard = (fileName: string) => adapter.remove(fileName).catch(() => undefined);

  const readEnvelope = async (fileName: string) => {
    const raw = await adapter.read(fileName).catch(() => null);
    if (raw === null) {
      return null;
    }
    try {
      const parsed = EnvelopeShapeSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : 'corrupt';
    } catch {
      return 'corrupt';
    }
  };

  return {
    load: async (accountKey, flowKey, payloadSchema) => {
      const fileName = draftFileName(accountKey, flowKey);
      const envelope = await readEnvelope(fileName);
      if (envelope === null) {
        return null;
      }
      if (
        envelope === 'corrupt' ||
        envelope.flowKey !== flowKey ||
        envelope.accountKey !== toDraftAccountKey(accountKey) ||
        isExpired(envelope.updatedAt, now(), ttlMs)
      ) {
        await discard(fileName);
        return null;
      }
      const payload = payloadSchema.safeParse(envelope.payload);
      if (!payload.success) {
        await discard(fileName);
        return null;
      }
      return { ...envelope, schemaVersion: DRAFT_SCHEMA_VERSION, payload: payload.data };
    },
    save: async (input) => {
      const envelope = {
        schemaVersion: DRAFT_SCHEMA_VERSION,
        accountKey: toDraftAccountKey(input.accountKey),
        flowKey: input.flowKey,
        idempotencyKey: input.idempotencyKey,
        payload: input.payload,
        lastErrorDetail: input.lastErrorDetail ?? null,
        updatedAt: new Date(now()).toISOString(),
      } satisfies DraftEnvelope<unknown>;
      const content = JSON.stringify(envelope);
      if (containsSignedUrl(content)) {
        throw new DraftSecretError('Signed file URLs must never be persisted inside drafts.');
      }
      await adapter.writeAtomic(draftFileName(input.accountKey, input.flowKey), content);
      return envelope;
    },
    remove: (accountKey, flowKey) => discard(draftFileName(accountKey, flowKey)),
    purgeExpired: async () => {
      const fileNames = (await adapter.list().catch(() => [])).filter(isDraftFileName);
      let removed = 0;
      for (const fileName of fileNames) {
        const envelope = await readEnvelope(fileName);
        if (envelope === 'corrupt' || (envelope && isExpired(envelope.updatedAt, now(), ttlMs))) {
          await discard(fileName);
          removed += 1;
        }
      }
      return removed;
    },
  };
}

export function createMemoryDraftAdapter(
  initial: Readonly<Record<string, string>> = {},
): DraftFileAdapter & { readonly snapshot: () => Readonly<Record<string, string>> } {
  const files = new Map(Object.entries(initial));
  return {
    read: async (fileName) => files.get(fileName) ?? null,
    writeAtomic: async (fileName, content) => {
      files.set(fileName, content);
    },
    remove: async (fileName) => {
      files.delete(fileName);
    },
    list: async () => [...files.keys()],
    snapshot: () => Object.fromEntries(files),
  };
}

export type WebDraftStorageLike = {
  readonly length: number;
  readonly key: (index: number) => string | null;
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
};

const WEB_PREFIX = `${DRAFT_DIRECTORY_NAME}/`;

export function createWebDraftAdapter(storage: WebDraftStorageLike): DraftFileAdapter {
  return {
    read: async (fileName) => storage.getItem(`${WEB_PREFIX}${fileName}`),
    writeAtomic: async (fileName, content) => {
      storage.setItem(`${WEB_PREFIX}${fileName}`, content);
    },
    remove: async (fileName) => {
      storage.removeItem(`${WEB_PREFIX}${fileName}`);
    },
    list: async () => {
      const names: string[] = [];
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key?.startsWith(WEB_PREFIX)) {
          names.push(key.slice(WEB_PREFIX.length));
        }
      }
      return names;
    },
  };
}

export function createExpoFileDraftAdapter(
  root: Directory = new Directory(Paths.document, DRAFT_DIRECTORY_NAME),
): DraftFileAdapter {
  const ensureRoot = () => {
    if (!root.exists) {
      root.create({ intermediates: true, idempotent: true });
    }
  };
  return {
    read: async (fileName) => {
      const file = new File(root, fileName);
      return file.exists ? file.text() : null;
    },
    writeAtomic: async (fileName, content) => {
      ensureRoot();
      const temp = new File(root, `${fileName}.writing.tmp`);
      temp.create({ overwrite: true });
      await temp.write(content);
      await temp.move(new File(root, fileName), { overwrite: true });
    },
    remove: async (fileName) => {
      const file = new File(root, fileName);
      if (file.exists) {
        file.delete();
      }
    },
    list: async () => {
      if (!root.exists) {
        return [];
      }
      return root.list().flatMap((entry) => (entry instanceof File ? [entry.name] : []));
    },
  };
}

function resolveWebDraftStorage(): WebDraftStorageLike | null {
  return (globalThis as { localStorage?: WebDraftStorageLike }).localStorage ?? null;
}

export function createPlatformDraftAdapter(
  platform: string = Platform.OS,
  webStorage: WebDraftStorageLike | null = resolveWebDraftStorage(),
): DraftFileAdapter {
  if (platform !== 'web') {
    return createExpoFileDraftAdapter();
  }
  return webStorage ? createWebDraftAdapter(webStorage) : createMemoryDraftAdapter();
}

let defaultDraftStorage: DraftStorage | null = null;

export function getDefaultDraftStorage(): DraftStorage {
  defaultDraftStorage ??= createDraftStorage(createPlatformDraftAdapter());
  return defaultDraftStorage;
}
