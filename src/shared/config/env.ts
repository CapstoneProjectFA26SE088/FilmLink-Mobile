import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url(),
});

export type Env = z.infer<typeof EnvSchema>;

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
