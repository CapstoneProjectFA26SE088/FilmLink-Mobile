import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url(),
});

const URL_AUTHORITY_RE =
  /^([a-zA-Z][a-zA-Z\d+\-.]*:\/\/(?:[^@\s/?#]+@)?)(\[[0-9a-fA-F:]+\]|[^:\s/?#]+)((?::\d+)?(?:[/?#].*)?)$/;

export type Env = z.infer<typeof EnvSchema>;

export type RuntimeApiUrlOptions = {
  readonly platform?: string;
  readonly hostUri?: string | null;
};

export class EnvError extends Error {
  override readonly name = 'EnvError';
}

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const parsed = EnvSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new EnvError(`Invalid environment. ${issues}. Check .env against .env.example.`);
}

function isLoopbackHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '[::1]'
  );
}

function isTunnelHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized.endsWith('.exp.direct') ||
    normalized.endsWith('.ngrok.io') ||
    normalized.endsWith('.ngrok-free.app')
  );
}

function extractDevHostname(hostUri: string | null | undefined): string | null {
  const trimmed = hostUri?.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }
  const normalized = trimmed.includes('://') ? trimmed : `http://${trimmed}`;
  const match = URL_AUTHORITY_RE.exec(normalized);
  if (!match) {
    return null;
  }
  const hostname = match[2];
  if (!hostname || isLoopbackHost(hostname) || isTunnelHost(hostname)) {
    return null;
  }
  return hostname;
}

export function resolveRuntimeApiUrl(rawUrl: string, options: RuntimeApiUrlOptions = {}): string {
  const match = URL_AUTHORITY_RE.exec(rawUrl);
  if (!match) {
    return rawUrl;
  }
  const [, prefix, hostname, suffix] = match;
  if (!hostname || !isLoopbackHost(hostname) || options.platform === 'web') {
    return rawUrl;
  }
  const devHost = extractDevHostname(options.hostUri);
  const targetHost = devHost ?? (options.platform === 'android' ? '10.0.2.2' : null);
  if (!targetHost) {
    return rawUrl;
  }
  return `${prefix}${targetHost}${suffix}`;
}
