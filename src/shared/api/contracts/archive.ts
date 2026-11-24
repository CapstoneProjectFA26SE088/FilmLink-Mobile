import { z } from 'zod';
import { createPageResponseSchema, IsoTimestampSchema, PositiveIdSchema } from './common';

export const ScanFileResponseSchema = z.object({
  id: PositiveIdSchema,
  frameNumber: z.number().int().positive(),
  widthPx: z.number().int().positive(),
  heightPx: z.number().int().positive(),
  sizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string().min(1),
  url: z.string().min(1),
  createdAt: IsoTimestampSchema,
});
export type ScanFileResponse = z.infer<typeof ScanFileResponseSchema>;

export const SearchFilmArchiveParamsSchema = z.object({
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type SearchFilmArchiveParams = z.infer<typeof SearchFilmArchiveParamsSchema>;

export const FilmArchiveRollSummaryResponseSchema = z.object({
  archiveRollId: PositiveIdSchema,
  filmRollId: PositiveIdSchema,
  rollSequence: z.number().int().positive(),
  serviceOrderId: PositiveIdSchema,
  orderCode: z.string().min(1),
  filmLabId: PositiveIdSchema,
  labName: z.string().min(1),
  filmStockId: PositiveIdSchema.nullable(),
  filmStockName: z.string().nullable(),
  filmFormatId: PositiveIdSchema.nullable(),
  filmFormatName: z.string().nullable(),
  deliveredAt: IsoTimestampSchema,
  previewCount: z.number().int().nonnegative(),
  coverPreviewUrl: z.string().nullable(),
});
export type FilmArchiveRollSummaryResponse = z.infer<typeof FilmArchiveRollSummaryResponseSchema>;

export const FilmArchiveRollSummaryPageSchema = createPageResponseSchema(
  FilmArchiveRollSummaryResponseSchema,
);

export const FilmArchiveRollResponseSchema = z.object({
  archiveRollId: PositiveIdSchema,
  filmRollId: PositiveIdSchema,
  rollSequence: z.number().int().positive(),
  serviceOrderId: PositiveIdSchema,
  orderCode: z.string().min(1),
  filmLabId: PositiveIdSchema,
  labName: z.string().min(1),
  filmStockId: PositiveIdSchema.nullable(),
  filmStockName: z.string().nullable(),
  filmFormatId: PositiveIdSchema.nullable(),
  filmFormatName: z.string().nullable(),
  exposureCount: z.number().int().positive(),
  fullResolutionLink: z.string().nullable(),
  linkVerifiedAt: IsoTimestampSchema.nullable(),
  deliveredAt: IsoTimestampSchema,
  camera: z.string().nullable(),
  lens: z.string().nullable(),
  shotOn: z.string().nullable(),
  location: z.string().nullable(),
  note: z.string().nullable(),
  frameCountDiscrepancyNote: z.string().nullable(),
  previews: z.array(ScanFileResponseSchema),
});
export type FilmArchiveRollResponse = z.infer<typeof FilmArchiveRollResponseSchema>;
