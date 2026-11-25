import { z } from 'zod';
import { CatalogStatus, HandoverMethod, PaymentMethod } from '@/shared/domain';
import {
  createPageResponseSchema,
  IsoTimestampSchema,
  PositiveIdSchema,
  UuidSchema,
  VnPhoneSchema,
} from './common';

export const NegativeSourceTypeSchema = z.enum(['UPLOADED_NEGATIVE', 'ARCHIVE_SCAN_FILE']);
export type NegativeSourceType = z.infer<typeof NegativeSourceTypeSchema>;

export const DetectedFilmBaseTypeSchema = z.enum([
  'C41_COLOR_NEGATIVE',
  'BW_NEGATIVE',
  'ECN2_CINEMA',
  'E6_SLIDE',
  'UNKNOWN',
]);
export type DetectedFilmBaseType = z.infer<typeof DetectedFilmBaseTypeSchema>;

export const NegativePreviewStatusSchema = z.enum([
  'ANALYZING',
  'AWAITING_INTENT',
  'GENERATING',
  'READY',
  'FAILED',
  'EXPIRED',
]);
export type NegativePreviewStatus = z.infer<typeof NegativePreviewStatusSchema>;

export const DownloadUnlockTypeSchema = z.enum(['LOCKED', 'FREE_QUOTA', 'PAID']);
export type DownloadUnlockType = z.infer<typeof DownloadUnlockTypeSchema>;

export const SuggestedIntentChipSchema = z.object({
  code: z.string().min(1),
  labelVn: z.string().min(1),
  promptText: z.string().min(3).max(500),
});
export type SuggestedIntentChip = z.infer<typeof SuggestedIntentChipSchema>;

export const NegativePreviewTurnResponseSchema = z.object({
  id: PositiveIdSchema,
  turnNumber: z.number().int().positive(),
  userIntentPrompt: z.string().min(1),
  assistantReplyVn: z.string().nullable(),
  previewWatermarkedUrl: z.string().min(1).nullable(),
  isFallback: z.boolean(),
  createdAt: IsoTimestampSchema,
});
export type NegativePreviewTurnResponse = z.infer<typeof NegativePreviewTurnResponseSchema>;

export const CreateNegativePreviewSessionDataSchema = z
  .object({
    sourceType: NegativeSourceTypeSchema,
    scanFileId: PositiveIdSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === 'ARCHIVE_SCAN_FILE' && data.scanFileId === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['scanFileId'],
        message: 'scanFileId is required when sourceType is ARCHIVE_SCAN_FILE.',
      });
    }
    if (data.sourceType === 'UPLOADED_NEGATIVE' && data.scanFileId !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['scanFileId'],
        message: 'scanFileId must be omitted when sourceType is UPLOADED_NEGATIVE.',
      });
    }
  });
export type CreateNegativePreviewSessionData = z.infer<
  typeof CreateNegativePreviewSessionDataSchema
>;

export const GenerateNegativePreviewRequestSchema = z.object({
  intentPrompt: z.string().trim().min(3).max(500),
  styleCode: z.string().trim().min(1).max(60).optional(),
});
export type GenerateNegativePreviewRequest = z.infer<typeof GenerateNegativePreviewRequestSchema>;

export const NegativePreviewSessionListParamsSchema = z.object({
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type NegativePreviewSessionListParams = z.infer<
  typeof NegativePreviewSessionListParamsSchema
>;

export const UnlockNegativePreviewDownloadRequestSchema = z.object({
  useFreeQuota: z.boolean().optional(),
  bankCode: z
    .string()
    .regex(/^[A-Za-z0-9]{2,20}$/)
    .optional(),
  locale: z.enum(['vn', 'en']).optional(),
});
export type UnlockNegativePreviewDownloadRequest = z.infer<
  typeof UnlockNegativePreviewDownloadRequestSchema
>;

function validatePrintOrderHandoverFields(
  order: {
    readonly filmHandoverMethod: HandoverMethod;
    readonly customerAddressLine?: string;
    readonly customerDistrict?: string;
    readonly customerProvince?: string;
    readonly customerPhone?: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (order.filmHandoverMethod === HandoverMethod.SELF_DROP_OFF) {
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
      ctx.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} is required when filmHandoverMethod is not SELF_DROP_OFF.`,
      });
    }
  }
}

const PreviewPrintOrderBaseSchema = z.object({
  filmLabId: PositiveIdSchema,
  printSizeId: PositiveIdSchema,
  quantity: z.number().int().min(1).max(500),
  filmHandoverMethod: z.enum(HandoverMethod),
  customerAddressLine: z.string().max(255).optional(),
  customerDistrict: z.string().max(100).optional(),
  customerProvince: z.string().max(100).optional(),
  customerPhone: VnPhoneSchema.optional(),
  note: z.string().max(300).optional(),
});

export const QuotePreviewPrintOrderRequestSchema = PreviewPrintOrderBaseSchema.superRefine(
  validatePrintOrderHandoverFields,
);
export type QuotePreviewPrintOrderRequest = z.infer<typeof QuotePreviewPrintOrderRequestSchema>;

export const CreatePreviewPrintOrderRequestSchema = PreviewPrintOrderBaseSchema.extend({
  idempotencyKey: UuidSchema,
  paymentMethod: z.enum([PaymentMethod.ONLINE, PaymentMethod.PAY_AT_LAB]),
}).superRefine(validatePrintOrderHandoverFields);
export type CreatePreviewPrintOrderRequest = z.infer<typeof CreatePreviewPrintOrderRequestSchema>;

export const NegativePreviewSessionSummaryResponseSchema = z.object({
  id: PositiveIdSchema,
  sessionCode: z.string().min(1),
  sourceType: NegativeSourceTypeSchema,
  detectedBaseType: DetectedFilmBaseTypeSchema,
  status: NegativePreviewStatusSchema,
  regenerationCount: z.number().int().nonnegative(),
  maxRegenerations: z.number().int().positive().optional().default(3),
  downloadUnlockType: DownloadUnlockTypeSchema,
  previewWatermarkedUrl: z.string().min(1).nullable(),
  expiresAt: IsoTimestampSchema,
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type NegativePreviewSessionSummaryResponse = z.infer<
  typeof NegativePreviewSessionSummaryResponseSchema
>;

export const NegativePreviewSessionSummaryPageSchema = createPageResponseSchema(
  NegativePreviewSessionSummaryResponseSchema,
);

export const NegativePreviewSessionResponseSchema =
  NegativePreviewSessionSummaryResponseSchema.extend({
    sourceScanFileId: PositiveIdSchema.nullable(),
    sourceSignedUrl: z.string().min(1).nullable(),
    baseInvertedSignedUrl: z.string().min(1).nullable(),
    exposureDiagnosisVn: z.string().nullable(),
    aiInspectionSummaryVn: z.string().nullable(),
    assistantQuestionVn: z.string().nullable(),
    suggestedIntents: z.array(SuggestedIntentChipSchema).optional().default([]),
    userIntentPrompt: z.string().nullable(),
    unlockFeeVnd: z.number().int().nonnegative().optional().default(0),
    remainingDailyFreeQuota: z.number().int().nonnegative().nullable().optional(),
    downloadUnlockedAt: IsoTimestampSchema.nullable(),
    isFallback: z.boolean().optional().default(false),
    turns: z.array(NegativePreviewTurnResponseSchema).optional().default([]),
  });
export type NegativePreviewSessionResponse = z.infer<typeof NegativePreviewSessionResponseSchema>;

export const UnlockNegativePreviewDownloadResponseSchema = z.object({
  sessionId: PositiveIdSchema,
  downloadUnlockType: DownloadUnlockTypeSchema,
  unlocked: z.boolean(),
  paymentUrl: z.string().min(1).nullable(),
  unlockFeeVnd: z.number().int().nonnegative(),
  remainingDailyFreeQuota: z.number().int().nonnegative().nullable().optional(),
});
export type UnlockNegativePreviewDownloadResponse = z.infer<
  typeof UnlockNegativePreviewDownloadResponseSchema
>;

export const NegativePreviewDownloadResponseSchema = z.object({
  downloadUrl: z.string().min(1),
  expiresAt: IsoTimestampSchema,
  checksumSha256: z.string().min(1),
});
export type NegativePreviewDownloadResponse = z.infer<typeof NegativePreviewDownloadResponseSchema>;

export const PrintSizeResponseSchema = z.object({
  id: PositiveIdSchema,
  code: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().nullable().optional().default(null),
  widthMm: z.number().int().positive(),
  heightMm: z.number().int().positive(),
  status: z.enum(CatalogStatus).optional().default(CatalogStatus.ACTIVE),
});
export type PrintSizeResponse = z.infer<typeof PrintSizeResponseSchema>;

export const LabPrintPriceTierResponseSchema = z.object({
  id: PositiveIdSchema.optional(),
  printSizeId: PositiveIdSchema,
  minQuantity: z.number().int().min(1),
  unitPriceVnd: z.number().int().positive(),
});
export type LabPrintPriceTierResponse = z.infer<typeof LabPrintPriceTierResponseSchema>;

export const PreviewPrintOrderQuoteResponseSchema = z.object({
  filmLabId: PositiveIdSchema,
  printSizeId: PositiveIdSchema,
  printSizeCode: z.string().min(1),
  printSizeName: z.string().min(1),
  quantity: z.number().int().min(1).max(500),
  unitPriceVnd: z.number().int().nonnegative(),
  printSubtotalVnd: z.number().int().nonnegative(),
  deliveryFeeVnd: z.number().int().nonnegative(),
  estimatedTotalVnd: z.number().int().nonnegative(),
  expectedReturnAt: IsoTimestampSchema.nullable(),
});
export type PreviewPrintOrderQuoteResponse = z.infer<typeof PreviewPrintOrderQuoteResponseSchema>;
