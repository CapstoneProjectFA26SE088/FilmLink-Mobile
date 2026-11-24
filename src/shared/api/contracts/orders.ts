import { z } from 'zod';
import {
  FilmRollStatus,
  HandoverMethod,
  HandoverPoint,
  MAX_EXPOSURE_COUNT,
  MAX_PUSH_PULL_STOPS,
  MAX_ROLL_COUNT,
  MAX_SHOOTING_ISO,
  MIN_EXPOSURE_COUNT,
  MIN_PUSH_PULL_STOPS,
  MIN_ROLL_COUNT,
  MIN_SHOOTING_ISO,
  PaymentMethod,
  ProcessingStage,
  ScheduleChangeChoice,
  ServiceOrderStatus,
  ServiceTier,
} from '@/shared/domain';
import {
  createPageResponseSchema,
  IsoTimestampSchema,
  PositiveIdSchema,
  UuidSchema,
  VnPhoneSchema,
} from './common';

export const FilmRollRequestSchema = z
  .object({
    filmStockId: PositiveIdSchema.nullable().optional(),
    filmStockNameText: z.string().trim().max(100).nullable().optional(),
    filmFormatId: PositiveIdSchema,
    exposureCount: z.number().int().min(MIN_EXPOSURE_COUNT).max(MAX_EXPOSURE_COUNT),
    shootingIso: z.number().int().min(MIN_SHOOTING_ISO).max(MAX_SHOOTING_ISO).nullable().optional(),
    servicePackageId: PositiveIdSchema,
    servicePackageScanOptionId: PositiveIdSchema.nullable().optional(),
    pushPullStops: z
      .number()
      .int()
      .min(MIN_PUSH_PULL_STOPS)
      .max(MAX_PUSH_PULL_STOPS)
      .nullable()
      .optional(),
  })
  .superRefine((roll, ctx) => {
    const hasId = typeof roll.filmStockId === 'number';
    const hasText = (roll.filmStockNameText?.trim().length ?? 0) > 0;
    if (hasId === hasText) {
      ctx.addIssue({
        code: 'custom',
        path: ['filmStockId'],
        message: 'Provide exactly one of filmStockId or filmStockNameText.',
      });
    }
  });
export type FilmRollRequest = z.infer<typeof FilmRollRequestSchema>;

function validatePickupOrderFields(
  order: {
    readonly filmHandoverMethod: HandoverMethod;
    readonly customerAddressLine?: string;
    readonly customerDistrict?: string;
    readonly customerProvince?: string;
    readonly customerPhone?: string;
    readonly pickupWindowStartAt?: string;
    readonly pickupWindowEndAt?: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (order.filmHandoverMethod !== HandoverMethod.PICKUP) {
    return;
  }
  const requiredFields = [
    ['customerAddressLine', order.customerAddressLine?.trim()],
    ['customerDistrict', order.customerDistrict?.trim()],
    ['customerProvince', order.customerProvince?.trim()],
    ['customerPhone', order.customerPhone?.trim()],
  ] as const;
  for (const [field, value] of requiredFields) {
    if (!value) {
      ctx.addIssue({ code: 'custom', path: [field], message: `${field} is required for PICKUP.` });
    }
  }
  const startMs = Date.parse(order.pickupWindowStartAt ?? '');
  const endMs = Date.parse(order.pickupWindowEndAt ?? '');
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
    ctx.addIssue({
      code: 'custom',
      path: ['pickupWindowEndAt'],
      message: 'pickupWindowEndAt must be later than pickupWindowStartAt.',
    });
  }
}

export const CreateServiceOrderRequestSchema = z
  .object({
    idempotencyKey: UuidSchema.optional(),
    filmLabId: PositiveIdSchema,
    serviceTier: z.enum(ServiceTier),
    filmHandoverMethod: z.enum(HandoverMethod),
    paymentMethod: z.enum(PaymentMethod),
    specialRequest: z.string().max(500).optional(),
    customerAddressLine: z.string().max(255).optional(),
    customerDistrict: z.string().max(100).optional(),
    customerProvince: z.string().max(100).optional(),
    customerPhone: VnPhoneSchema.optional(),
    pickupWindowStartAt: IsoTimestampSchema.optional(),
    pickupWindowEndAt: IsoTimestampSchema.optional(),
    rolls: z.array(FilmRollRequestSchema).min(MIN_ROLL_COUNT).max(MAX_ROLL_COUNT),
  })
  .superRefine(validatePickupOrderFields);
export type CreateServiceOrderRequest = z.infer<typeof CreateServiceOrderRequestSchema>;

export const SubmitServiceOrderRequestSchema = CreateServiceOrderRequestSchema.safeExtend({
  idempotencyKey: UuidSchema,
});
export type SubmitServiceOrderRequest = z.infer<typeof SubmitServiceOrderRequestSchema>;

export const OrderQuoteRollResponseSchema = z.object({
  rollSequence: z.number().int().positive(),
  servicePackageId: PositiveIdSchema,
  packageName: z.string().min(1),
  servicePackageScanOptionId: PositiveIdSchema.nullable(),
  scanResolutionLabel: z.string().nullable(),
  pushPullStops: z.number().int().min(MIN_PUSH_PULL_STOPS).max(MAX_PUSH_PULL_STOPS),
  unitPriceVnd: z.number().int().nonnegative(),
  scanOptionPriceVnd: z.number().int().nonnegative(),
  pushPullSurchargeVnd: z.number().int().nonnegative(),
  rollPriceVnd: z.number().int().nonnegative(),
});
export type OrderQuoteRollResponse = z.infer<typeof OrderQuoteRollResponseSchema>;

export const ServiceOrderQuoteResponseSchema = z.object({
  rolls: z.array(OrderQuoteRollResponseSchema),
  subtotalVnd: z.number().int().nonnegative(),
  expressSurchargeVnd: z.number().int().nonnegative(),
  deliveryFeeVnd: z.number().int().nonnegative(),
  estimatedTotalVnd: z.number().int().nonnegative(),
  expectedReturnAt: IsoTimestampSchema,
});
export type ServiceOrderQuoteResponse = z.infer<typeof ServiceOrderQuoteResponseSchema>;

export const FilmRollResponseSchema = z.object({
  id: PositiveIdSchema,
  rollSequence: z.number().int().positive(),
  filmStockId: PositiveIdSchema.nullable(),
  filmStockNameText: z.string().nullable(),
  filmFormatId: PositiveIdSchema,
  filmProcessId: PositiveIdSchema,
  servicePackageId: PositiveIdSchema,
  servicePackageScanOptionId: PositiveIdSchema.nullable(),
  exposureCount: z.number().int().positive(),
  shootingIso: z.number().int().positive().nullable(),
  pushPullStops: z.number().int(),
  unitPriceVnd: z.number().int().nonnegative(),
  scanOptionPriceVnd: z.number().int().nonnegative(),
  pushPullSurchargeVnd: z.number().int().nonnegative(),
  expressSurchargeVnd: z.number().int().nonnegative(),
  status: z.enum(FilmRollStatus),
  archiveRollId: PositiveIdSchema.nullable().optional().default(null),
  previewScanCount: z.number().int().nonnegative().nullable().optional().default(null),
  fullResolutionLink: z.string().nullable().optional().default(null),
});
export type FilmRollResponse = z.infer<typeof FilmRollResponseSchema>;

export const ServiceOrderSummaryResponseSchema = z.object({
  id: PositiveIdSchema,
  orderCode: z.string().min(1),
  status: z.enum(ServiceOrderStatus),
  filmLabId: PositiveIdSchema,
  labName: z.string().min(1).nullable(),
  rollCount: z.number().int().positive(),
  estimatedTotalVnd: z.number().int().nonnegative(),
  finalTotalVnd: z.number().int().nonnegative().nullable(),
  expectedReturnAt: IsoTimestampSchema.nullable(),
  promisedReturnAt: IsoTimestampSchema.nullable(),
  createdAt: IsoTimestampSchema,
});
export type ServiceOrderSummaryResponse = z.infer<typeof ServiceOrderSummaryResponseSchema>;

export const ServiceOrderSummaryPageSchema = createPageResponseSchema(
  ServiceOrderSummaryResponseSchema,
);

export const ServiceOrderResponseSchema = z.object({
  id: PositiveIdSchema,
  orderCode: z.string().min(1),
  status: z.enum(ServiceOrderStatus),
  filmLabId: PositiveIdSchema,
  serviceTier: z.enum(ServiceTier),
  filmHandoverMethod: z.enum(HandoverMethod),
  paymentMethod: z.enum(PaymentMethod),
  specialRequest: z.string().nullable(),
  customerAddressLine: z.string().nullable(),
  customerDistrict: z.string().nullable(),
  customerProvince: z.string().nullable(),
  customerPhone: z.string().nullable(),
  pickupWindowStartAt: IsoTimestampSchema.nullable(),
  pickupWindowEndAt: IsoTimestampSchema.nullable(),
  estimatedTotalVnd: z.number().int().nonnegative(),
  expectedReturnAt: IsoTimestampSchema.nullable(),
  labResponseDueAt: IsoTimestampSchema.nullable(),
  rolls: z.array(FilmRollResponseSchema),
  payment: z.unknown().nullable(),
  createdAt: IsoTimestampSchema,
});
export type ServiceOrderResponse = z.infer<typeof ServiceOrderResponseSchema>;

export const OrderLabBriefSchema = z.object({
  id: PositiveIdSchema,
  labName: z.string().min(1),
  addressLine: z.string(),
  district: z.string(),
  province: z.string(),
});
export type OrderLabBrief = z.infer<typeof OrderLabBriefSchema>;

export const OrderStageRecordSchema = z.object({
  stage: z.enum(ProcessingStage),
  recordedAt: IsoTimestampSchema,
  note: z.string().nullable(),
});
export type OrderStageRecord = z.infer<typeof OrderStageRecordSchema>;

export const OrderHandoverPhotoSchema = z.object({
  id: PositiveIdSchema,
  displayOrder: z.number().int().nonnegative(),
  url: z.string().min(1),
});
export type OrderHandoverPhoto = z.infer<typeof OrderHandoverPhotoSchema>;

export const OrderHandoverResponseSchema = z.object({
  id: PositiveIdSchema,
  handoverPoint: z.enum(HandoverPoint),
  rollCount: z.number().int().positive(),
  note: z.string().nullable(),
  occurredAt: IsoTimestampSchema,
  photos: z.array(OrderHandoverPhotoSchema),
});
export type OrderHandoverResponse = z.infer<typeof OrderHandoverResponseSchema>;

export const ServiceOrderDetailResponseSchema = z.object({
  id: PositiveIdSchema,
  orderCode: z.string().min(1),
  status: z.enum(ServiceOrderStatus),
  lab: OrderLabBriefSchema.nullable(),
  serviceTier: z.enum(ServiceTier),
  filmHandoverMethod: z.enum(HandoverMethod),
  paymentMethod: z.enum(PaymentMethod),
  specialRequest: z.string().nullable(),
  customerAddressLine: z.string().nullable(),
  customerDistrict: z.string().nullable(),
  customerProvince: z.string().nullable(),
  customerPhone: z.string().nullable(),
  pickupWindowStartAt: IsoTimestampSchema.nullable(),
  pickupWindowEndAt: IsoTimestampSchema.nullable(),
  estimatedTotalVnd: z.number().int().nonnegative(),
  finalTotalVnd: z.number().int().nonnegative().nullable(),
  priceLockedAt: IsoTimestampSchema.nullable(),
  expectedReturnAt: IsoTimestampSchema.nullable(),
  promisedReturnAt: IsoTimestampSchema.nullable(),
  acceptedAt: IsoTimestampSchema.nullable(),
  deliveredAt: IsoTimestampSchema.nullable(),
  closedAt: IsoTimestampSchema.nullable(),
  cancelledAt: IsoTimestampSchema.nullable().optional().default(null),
  cancellationReason: z.string().nullable().optional().default(null),
  cancellationFeeVnd: z.number().int().nonnegative().nullable().optional().default(null),
  keepNegativesAtLab: z.boolean().optional().default(false),
  rolls: z.array(FilmRollResponseSchema),
  stages: z.array(OrderStageRecordSchema),
  handovers: z.array(OrderHandoverResponseSchema),
  payment: z.unknown().nullable(),
  createdAt: IsoTimestampSchema,
});
export type ServiceOrderDetailResponse = z.infer<typeof ServiceOrderDetailResponseSchema>;

export const CancelServiceOrderRequestSchema = z.object({
  reason: z.string().trim().min(10).max(500),
});
export type CancelServiceOrderRequest = z.infer<typeof CancelServiceOrderRequestSchema>;

export const ScheduleChangeAnswerRequestSchema = z.object({
  choice: z.enum(ScheduleChangeChoice),
  note: z.string().max(300).optional(),
});
export type ScheduleChangeAnswerRequest = z.infer<typeof ScheduleChangeAnswerRequestSchema>;

export const VnpaySandboxUrlRequestSchema = z.object({
  amountVnd: z.number().int().min(10_000).max(50_000_000),
  bankCode: z
    .string()
    .regex(/^[A-Za-z0-9]{2,20}$/)
    .optional(),
  locale: z.enum(['vn', 'en']).optional(),
});
export type VnpaySandboxUrlRequest = z.infer<typeof VnpaySandboxUrlRequestSchema>;

export const VnpaySandboxUrlResponseSchema = z.object({
  paymentUrl: z.string().min(1),
});
export type VnpaySandboxUrlResponse = z.infer<typeof VnpaySandboxUrlResponseSchema>;

export const ServiceOrderListParamsSchema = z.object({
  status: z.enum(ServiceOrderStatus).optional(),
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type ServiceOrderListParams = z.infer<typeof ServiceOrderListParamsSchema>;
