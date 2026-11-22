import { useCallback, useEffect, useRef, useState } from 'react';
import type { z } from 'zod';
import {
  createIdempotencyKey,
  type DraftEnvelope,
  type DraftFlowKey,
  type DraftStorage,
  getDefaultDraftStorage,
  getErrorMessage,
  toDraftAccountKey,
} from '@/shared/lib';

export const DEFAULT_DRAFT_DEBOUNCE_MS = 400;

export type UseDraftPersistenceOptions<T> = {
  readonly flowKey: DraftFlowKey;
  readonly accountId?: number | string | null;
  readonly schema: z.ZodType<T>;
  readonly initialDraft: T;
  readonly isEmpty?: (draft: T) => boolean;
  readonly debounceMs?: number;
  readonly storage?: DraftStorage;
};

export type UseDraftPersistenceResult<T> = {
  readonly draft: T;
  readonly idempotencyKey: string;
  readonly isHydrated: boolean;
  readonly hasRecoverableDraft: boolean;
  readonly pendingRetry: boolean;
  readonly lastErrorDetail: string | null;
  readonly lastSavedAt: string | null;
  readonly updateDraft: (updater: T | ((prev: T) => T)) => void;
  readonly restoreDraft: () => T | null;
  readonly markSubmissionFailed: (error: unknown) => Promise<void>;
  readonly clearDraft: () => Promise<void>;
  readonly flushDraft: () => Promise<void>;
};

export function useDraftPersistence<T>({
  flowKey,
  accountId,
  schema,
  initialDraft,
  isEmpty,
  debounceMs = DEFAULT_DRAFT_DEBOUNCE_MS,
  storage = getDefaultDraftStorage(),
}: UseDraftPersistenceOptions<T>): UseDraftPersistenceResult<T> {
  const accountKey = toDraftAccountKey(accountId);

  const [draft, setDraft] = useState<T>(initialDraft);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(createIdempotencyKey);
  const [isHydrated, setIsHydrated] = useState(false);
  const [recoverablePayload, setRecoverablePayload] = useState<T | null>(null);
  const [pendingRetry, setPendingRetry] = useState(false);
  const [lastErrorDetail, setLastErrorDetail] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const draftRef = useRef<T>(draft);
  const idempotencyKeyRef = useRef<string>(idempotencyKey);
  const lastErrorDetailRef = useRef<string | null>(lastErrorDetail);
  const recoverablePayloadRef = useRef<T | null>(recoverablePayload);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scopeRef = useRef({ accountKey, flowKey });

  const schemaRef = useRef(schema);
  const initialDraftRef = useRef(initialDraft);
  const isEmptyRef = useRef(isEmpty);
  const storageRef = useRef(storage);

  schemaRef.current = schema;
  initialDraftRef.current = initialDraft;
  isEmptyRef.current = isEmpty;
  storageRef.current = storage;
  scopeRef.current = { accountKey, flowKey };

  const cancelPendingSave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persistSnapshot = useCallback(
    async (
      targetAccountKey: string,
      targetFlowKey: DraftFlowKey,
      payload: T,
      errorDetail: string | null,
      forceSave = false,
    ) => {
      if (!forceSave && isEmptyRef.current?.(payload)) {
        await storageRef.current.remove(targetAccountKey, targetFlowKey);
        if (
          scopeRef.current.accountKey === targetAccountKey &&
          scopeRef.current.flowKey === targetFlowKey
        ) {
          setLastSavedAt(null);
        }
        return;
      }
      const saved = await storageRef.current.save({
        accountKey: targetAccountKey,
        flowKey: targetFlowKey,
        idempotencyKey: idempotencyKeyRef.current,
        payload,
        lastErrorDetail: errorDetail,
      });
      if (
        scopeRef.current.accountKey === targetAccountKey &&
        scopeRef.current.flowKey === targetFlowKey
      ) {
        setLastSavedAt(saved.updatedAt);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    cancelPendingSave();

    const freshKey = createIdempotencyKey();
    const emptyDraft = initialDraftRef.current;
    draftRef.current = emptyDraft;
    idempotencyKeyRef.current = freshKey;
    lastErrorDetailRef.current = null;
    recoverablePayloadRef.current = null;

    setDraft(emptyDraft);
    setIdempotencyKey(freshKey);
    setIsHydrated(false);
    setRecoverablePayload(null);
    setPendingRetry(false);
    setLastErrorDetail(null);
    setLastSavedAt(null);

    const applyLoadedEnvelope = (envelope: DraftEnvelope<T> | null) => {
      if (envelope && !isEmptyRef.current?.(envelope.payload)) {
        idempotencyKeyRef.current = envelope.idempotencyKey;
        lastErrorDetailRef.current = envelope.lastErrorDetail;
        recoverablePayloadRef.current = envelope.payload;
        setIdempotencyKey(envelope.idempotencyKey);
        setRecoverablePayload(envelope.payload);
        setPendingRetry(envelope.lastErrorDetail !== null);
        setLastErrorDetail(envelope.lastErrorDetail);
        setLastSavedAt(envelope.updatedAt);
      }
      setIsHydrated(true);
    };

    const hydrate = async () => {
      try {
        const envelope = await storageRef.current.load(accountKey, flowKey, schemaRef.current);
        if (!cancelled) {
          applyLoadedEnvelope(envelope);
        }
      } catch {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
      cancelPendingSave();
    };
  }, [accountKey, flowKey, cancelPendingSave]);

  const updateDraft = useCallback(
    (updater: T | ((prev: T) => T)) => {
      const next =
        typeof updater === 'function' ? (updater as (prev: T) => T)(draftRef.current) : updater;
      draftRef.current = next;
      setDraft(next);

      cancelPendingSave();
      const targetAccountKey = scopeRef.current.accountKey;
      const targetFlowKey = scopeRef.current.flowKey;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void persistSnapshot(
          targetAccountKey,
          targetFlowKey,
          draftRef.current,
          lastErrorDetailRef.current,
        ).catch(() => undefined);
      }, debounceMs);
    },
    [cancelPendingSave, debounceMs, persistSnapshot],
  );

  const restoreDraft = useCallback((): T | null => {
    const payload = recoverablePayloadRef.current;
    if (payload === null) {
      return null;
    }
    draftRef.current = payload;
    recoverablePayloadRef.current = null;
    setDraft(payload);
    setRecoverablePayload(null);
    return payload;
  }, []);

  const markSubmissionFailed = useCallback(
    async (error: unknown) => {
      cancelPendingSave();
      const detail = getErrorMessage(error);
      lastErrorDetailRef.current = detail;
      setLastErrorDetail(detail);
      setPendingRetry(true);
      await persistSnapshot(
        scopeRef.current.accountKey,
        scopeRef.current.flowKey,
        draftRef.current,
        detail,
        true,
      );
    },
    [cancelPendingSave, persistSnapshot],
  );

  const flushDraft = useCallback(async () => {
    cancelPendingSave();
    await persistSnapshot(
      scopeRef.current.accountKey,
      scopeRef.current.flowKey,
      draftRef.current,
      lastErrorDetailRef.current,
    );
  }, [cancelPendingSave, persistSnapshot]);

  const clearDraft = useCallback(async () => {
    cancelPendingSave();
    const nextKey = createIdempotencyKey();
    const emptyDraft = initialDraftRef.current;
    draftRef.current = emptyDraft;
    idempotencyKeyRef.current = nextKey;
    lastErrorDetailRef.current = null;
    recoverablePayloadRef.current = null;

    setDraft(emptyDraft);
    setIdempotencyKey(nextKey);
    setRecoverablePayload(null);
    setPendingRetry(false);
    setLastErrorDetail(null);
    setLastSavedAt(null);

    await storageRef.current.remove(scopeRef.current.accountKey, scopeRef.current.flowKey);
  }, [cancelPendingSave]);

  return {
    draft,
    idempotencyKey,
    isHydrated,
    hasRecoverableDraft: recoverablePayload !== null,
    pendingRetry,
    lastErrorDetail,
    lastSavedAt,
    updateDraft,
    restoreDraft,
    markSubmissionFailed,
    clearDraft,
    flushDraft,
  };
}
