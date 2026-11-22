import { z } from 'zod';
import { createPageResponseSchema, PositiveIdSchema } from './common';

export const FilmLabOpeningHourSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  closed: z.boolean(),
  opensAt: z.string().nullable(),
  closesAt: z.string().nullable(),
});
export type FilmLabOpeningHour = z.infer<typeof FilmLabOpeningHourSchema>;

export const FilmLabImageResponseSchema = z.object({
  id: PositiveIdSchema,
  displayOrder: z.number().int().nonnegative(),
  url: z.string().min(1),
});
export type FilmLabImageResponse = z.infer<typeof FilmLabImageResponseSchema>;

export const PublicCatalogRefSchema = z.object({
  id: PositiveIdSchema,
  code: z.string().min(1),
  displayName: z.string().min(1),
});
export type PublicCatalogRef = z.infer<typeof PublicCatalogRefSchema>;

export const PublicScanOptionSchema = z.object({
  id: PositiveIdSchema,
  resolutionLabel: z.string().min(1),
  priceVnd: z.number().int().nonnegative(),
});
export type PublicScanOption = z.infer<typeof PublicScanOptionSchema>;

export const PublicServicePackageSchema = z.object({
  id: PositiveIdSchema,
  packageName: z.string().min(1),
  serviceType: PublicCatalogRefSchema,
  filmProcess: PublicCatalogRefSchema,
  filmFormat: PublicCatalogRefSchema,
  priceVnd: z.number().int().nonnegative(),
  turnaroundDays: z.number().int().positive(),
  pushPullAvailable: z.boolean(),
  pushPullSurchargePerStopVnd: z.number().int().nonnegative().nullable(),
  scanOptions: z.array(PublicScanOptionSchema),
});
export type PublicServicePackage = z.infer<typeof PublicServicePackageSchema>;

export const PublicFilmLabSummaryResponseSchema = z.object({
  id: PositiveIdSchema,
  labName: z.string().min(1),
  addressLine: z.string(),
  district: z.string(),
  province: z.string(),
  coverImageUrl: z.string().nullable(),
  minPriceVnd: z.number().int().nonnegative(),
  distanceKm: z.number().nonnegative().nullable(),
});
export type PublicFilmLabSummaryResponse = z.infer<typeof PublicFilmLabSummaryResponseSchema>;

export const PublicFilmLabSummaryPageSchema = createPageResponseSchema(
  PublicFilmLabSummaryResponseSchema,
);

export const PublicFilmLabResponseSchema = z.object({
  id: PositiveIdSchema,
  labName: z.string().min(1),
  description: z.string().nullable(),
  addressLine: z.string(),
  district: z.string(),
  province: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  openingHours: z.array(FilmLabOpeningHourSchema),
  images: z.array(FilmLabImageResponseSchema),
  packages: z.array(PublicServicePackageSchema),
});
export type PublicFilmLabResponse = z.infer<typeof PublicFilmLabResponseSchema>;

export const PublicFilmLabSearchParamsSchema = z
  .object({
    filmProcessId: PositiveIdSchema.optional(),
    filmFormatId: PositiveIdSchema.optional(),
    serviceTypeId: PositiveIdSchema.optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
    radiusKm: z.number().min(1).max(50).optional(),
    sort: z.enum(['price', 'distance']).optional(),
    page: z.number().int().nonnegative().optional(),
    size: z.number().int().min(1).max(100).optional(),
  })
  .superRefine((params, ctx) => {
    const hasLat = params.lat !== undefined;
    const hasLng = params.lng !== undefined;
    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: 'custom',
        path: [hasLat ? 'lng' : 'lat'],
        message: 'lat and lng must both be provided together.',
      });
    }
    if ((params.radiusKm !== undefined || params.sort === 'distance') && !(hasLat && hasLng)) {
      ctx.addIssue({
        code: 'custom',
        path: [params.radiusKm !== undefined ? 'radiusKm' : 'sort'],
        message: 'radiusKm and sort=distance require lat and lng.',
      });
    }
  });
export type PublicFilmLabSearchParams = z.infer<typeof PublicFilmLabSearchParamsSchema>;
