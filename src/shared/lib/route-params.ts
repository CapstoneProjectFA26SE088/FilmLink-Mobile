export type RawRouteParam = string | string[] | undefined;

export function firstRouteParam(value: string | readonly string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
}
