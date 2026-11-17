import { useSyncExternalStore } from 'react';

export type StoreListener = () => void;

export type Store<T> = {
  readonly getState: () => T;
  readonly setState: (updater: Partial<T> | ((prev: T) => T)) => void;
  readonly reset: () => void;
  readonly subscribe: (listener: StoreListener) => () => void;
};

export function createStore<T extends Record<string, unknown>>(initialState: T): Store<T> {
  let state = initialState;
  const listeners = new Set<StoreListener>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    getState: () => state,
    setState: (updater) => {
      const nextState = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
      if (Object.is(nextState, state)) {
        return;
      }
      state = nextState;
      notify();
    },
    reset: () => {
      if (Object.is(state, initialState)) {
        return;
      }
      state = initialState;
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useStore<T extends Record<string, unknown>, S>(
  store: Store<T>,
  selector: (state: T) => S,
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}
