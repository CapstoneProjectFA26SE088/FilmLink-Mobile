import { z } from 'zod';
import {
  AccountStatus,
  CatalogStatus,
  FilmRollStatus,
  HandoverMethod,
  HandoverPoint,
  MAX_EXPOSURE_COUNT,
  MAX_PASSWORD_LENGTH,
  MAX_PUSH_PULL_STOPS,
  MAX_ROLL_COUNT,
  MAX_SHOOTING_ISO,
  MIN_EXPOSURE_COUNT,
  MIN_PUSH_PULL_STOPS,
  MIN_ROLL_COUNT,
  MIN_SHOOTING_ISO,
  OtpPurpose,
  PASSWORD_COMPLEXITY_REGEX,
  PaymentMethod,
  ProcessingStage,
  Role,
  ScheduleChangeChoice,
  ServiceOrderStatus,
  ServiceTier,
  VN_PHONE_REGEX,
} from '@/shared/domain';

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

export const UserAccountResponseSchema = z.object({
  id: PositiveIdSchema,
  email: z.email(),
  fullName: z.string().min(1),
  phoneNumber: z.string().nullable(),
  role: z.enum(Role),
  status: z.enum(AccountStatus),
  emailVerifiedAt: IsoTimestampSchema.nullable(),
  createdAt: IsoTimestampSchema,
});
export type UserAccountResponse = z.infer<typeof UserAccountResponseSchema>;

export const RegisterRequestSchema = z.object({
  email: z.email().max(255),
  password: PasswordComplexitySchema,
  fullName: z.string().trim().min(2).max(100),
  phoneNumber: VnPhoneSchema.optional(),
  termsAccepted: z.literal(true),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const VerifyEmailRequestSchema = z.object({
  email: z.email().max(255),
  otp: OtpCodeSchema,
});
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const ResendOtpRequestSchema = z.object({
  email: z.email().max(255),
  purpose: z.enum(OtpPurpose).optional(),
});
export type ResendOtpRequest = z.infer<typeof ResendOtpRequestSchema>;

export const LoginRequestSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1).max(200),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const LogoutRequestSchema = z.object({
  refreshToken: z.string().min(1).max(200),
});
export type LogoutRequest = z.infer<typeof LogoutRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: z.email().max(255),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const VerifyPasswordResetOtpRequestSchema = z.object({
  email: z.email().max(255),
  otp: OtpCodeSchema,
});
export type VerifyPasswordResetOtpRequest = z.infer<typeof VerifyPasswordResetOtpRequestSchema>;

export const ResetTokenResponseSchema = z.object({
  resetToken: z.string().min(1),
});
export type ResetTokenResponse = z.infer<typeof ResetTokenResponseSchema>;

export const ResetPasswordRequestSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: PasswordComplexitySchema,
});
export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const ChangePasswordRequestSchema = z
  .object({
    oldPassword: z.string().min(1).max(MAX_PASSWORD_LENGTH),
    newPassword: PasswordComplexitySchema,
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from old password.',
  });
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;

export const CatalogItemResponseSchema = z.object({
  id: PositiveIdSchema,
  code: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().nullable(),
  status: z.enum(CatalogStatus),
});
export type CatalogItemResponse = z.infer<typeof CatalogItemResponseSchema>;

export const FilmFormatResponseSchema = CatalogItemResponseSchema;
export type FilmFormatResponse = CatalogItemResponse;

export const FilmProcessResponseSchema = CatalogItemResponseSchema;
export type FilmProcessResponse = CatalogItemResponse;

export const ServiceTypeResponseSchema = CatalogItemResponseSchema;
export type ServiceTypeResponse = CatalogItemResponse;

export const FilmStockResponseSchema = z.object({
  id: PositiveIdSchema,
  stockName: z.string().min(1),
  manufacturer: z.string().min(1),
  iso: z.number().int().min(1).max(6400),
  defaultFilmProcessId: PositiveIdSchema,
  defaultFilmProcessName: z.string().min(1),
  status: z.enum(CatalogStatus),
});
export type FilmStockResponse = z.infer<typeof FilmStockResponseSchema>;

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
});
export type FilmRollResponse = z.infer<typeof FilmRollResponseSchema>;

export const ServiceOrderSummaryResponseSchema = z.object({
  id: PositiveIdSchema,
  orderCode: z.string().min(1),
  status: z.enum(ServiceOrderStatus),
  filmLabId: PositiveIdSchema,
  labName: z.string().min(1),
  rollCount: z.number().int().positive(),
  estimatedTotalVnd: z.number().int().nonnegative(),
  finalTotalVnd: z.number().int().nonnegative().nullable(),
  expectedReturnAt: IsoTimestampSchema,
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
  expectedReturnAt: IsoTimestampSchema,
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
  expectedReturnAt: IsoTimestampSchema,
  promisedReturnAt: IsoTimestampSchema.nullable(),
  acceptedAt: IsoTimestampSchema.nullable(),
  deliveredAt: IsoTimestampSchema.nullable(),
  closedAt: IsoTimestampSchema.nullable(),
  rolls: z.array(FilmRollResponseSchema),
  stages: z.array(OrderStageRecordSchema),
  handovers: z.array(OrderHandoverResponseSchema),
  payment: z.unknown().nullable(),
  createdAt: IsoTimestampSchema,
});
export type ServiceOrderDetailResponse = z.infer<typeof ServiceOrderDetailResponseSchema>;

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

export const NOTIFICATION_TYPES = [
  'ORDER',
  'PAYMENT',
  'COMMISSION_DEBT',
  'MODERATION',
  'APPLICATION_REVIEW',
  'MARKETPLACE',
  'SCHEDULE_CHANGE',
  'COMPLAINT',
  'COMMUNITY',
  'SYSTEM',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const PUSH_TOKEN_PLATFORMS = ['ANDROID', 'IOS', 'WEB'] as const;
export type PushTokenPlatform = (typeof PUSH_TOKEN_PLATFORMS)[number];

export const NotificationItemResponseSchema = z.object({
  id: PositiveIdSchema,
  notificationType: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1),
  content: z.string().min(1),
  linkPath: z.string().nullable(),
  targetType: z.string().nullable(),
  targetId: PositiveIdSchema.nullable(),
  isRead: z.boolean(),
  readAt: IsoTimestampSchema.nullable(),
  createdAt: IsoTimestampSchema,
});
export type NotificationItemResponse = z.infer<typeof NotificationItemResponseSchema>;

export const NotificationPageSchema = createPageResponseSchema(NotificationItemResponseSchema);

export const UnreadNotificationCountResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
});
export type UnreadNotificationCountResponse = z.infer<typeof UnreadNotificationCountResponseSchema>;

export const RegisterPushTokenRequestSchema = z.object({
  fcmToken: z.string().min(1).max(500),
  platform: z.enum(PUSH_TOKEN_PLATFORMS),
});
export type RegisterPushTokenRequest = z.infer<typeof RegisterPushTokenRequestSchema>;

export const DeletePushTokenRequestSchema = z.object({
  fcmToken: z.string().min(1).max(500),
});
export type DeletePushTokenRequest = z.infer<typeof DeletePushTokenRequestSchema>;

export const ServiceOrderListParamsSchema = z.object({
  status: z.enum(ServiceOrderStatus).optional(),
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type ServiceOrderListParams = z.infer<typeof ServiceOrderListParamsSchema>;

export const NotificationListParamsSchema = z.object({
  unreadOnly: z.boolean().optional(),
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type NotificationListParams = z.infer<typeof NotificationListParamsSchema>;
