import { z } from 'zod';
import { PASSWORD_COMPLEXITY_REGEX, VN_PHONE_REGEX } from '@/shared/domain';

export const PositiveIdSchema = z.number().int().positive();
export const OtpCodeSchema = z.string().regex(/^\d{6}$/);
export const UuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
export const IsoTimestampSchema = z.iso.datetime({ offset: true });
export const VnPhoneSchema = z.string().trim().regex(VN_PHONE_REGEX);
export const PasswordComplexitySchema = z.string().regex(PASSWORD_COMPLEXITY_REGEX);

export function createPageResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    content: z.array(itemSchema),
    page: z.number().int().nonnegative(),
    size: z.number().int().nonnegative(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNext: z.boolean(),
  });
}

export type PageResponse<T> = {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
};
