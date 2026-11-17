import {
  type FilmFormat,
  type FilmLab,
  type FilmProcess,
  MAX_EXPOSURE_COUNT,
  MAX_PUSH_PULL_STOPS,
  MAX_ROLL_COUNT,
  MAX_SHOOTING_ISO,
  MIN_EXPOSURE_COUNT,
  MIN_PUSH_PULL_STOPS,
  MIN_ROLL_COUNT,
  MIN_SHOOTING_ISO,
} from '@/shared/domain';

export type LabFilterCriteria = {
  readonly search: string;
  readonly process: FilmProcess | 'ALL';
  readonly format: FilmFormat | 'ALL';
};

export function filterLabs(
  labs: readonly FilmLab[],
  filters: LabFilterCriteria,
): readonly FilmLab[] {
  const query = filters.search.trim().toLowerCase();
  return labs.filter((lab) => {
    const matchesQuery =
      !query || lab.name.toLowerCase().includes(query) || lab.city.toLowerCase().includes(query);
    const matchesProcess =
      filters.process === 'ALL' || lab.supportedProcesses.includes(filters.process);
    const matchesFormat = filters.format === 'ALL' || lab.supportedFormats.includes(filters.format);
    return matchesQuery && matchesProcess && matchesFormat;
  });
}

export function clampRollCount(current: number, delta: number): number {
  return Math.min(MAX_ROLL_COUNT, Math.max(MIN_ROLL_COUNT, Math.round(current + delta)));
}

export function clampPushPullStops(current: number, delta: number): number {
  return Math.min(MAX_PUSH_PULL_STOPS, Math.max(MIN_PUSH_PULL_STOPS, Math.round(current + delta)));
}

export function clampExposureCount(current: number, delta: number): number {
  return Math.min(MAX_EXPOSURE_COUNT, Math.max(MIN_EXPOSURE_COUNT, Math.round(current + delta)));
}

export function clampShootingIso(iso: number): number {
  return Math.min(MAX_SHOOTING_ISO, Math.max(MIN_SHOOTING_ISO, Math.round(iso)));
}
