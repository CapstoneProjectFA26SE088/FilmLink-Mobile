export type SingleFlight<T> = {
  readonly run: () => Promise<T>;
  readonly isInFlight: () => boolean;
};

export function createSingleFlight<T>(task: () => Promise<T>): SingleFlight<T> {
  let inFlight: Promise<T> | null = null;

  return {
    run: () => {
      if (inFlight) {
        return inFlight;
      }
      const current = Promise.resolve()
        .then(task)
        .finally(() => {
          if (inFlight === current) {
            inFlight = null;
          }
        });
      inFlight = current;
      return current;
    },
    isInFlight: () => inFlight !== null,
  };
}
