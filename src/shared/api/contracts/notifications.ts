import { z } from 'zod';
import { createPageResponseSchema, IsoTimestampSchema, PositiveIdSchema } from './common';

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

export const NotificationListParamsSchema = z.object({
  unreadOnly: z.boolean().optional(),
  page: z.number().int().nonnegative().optional(),
  size: z.number().int().min(1).max(100).optional(),
});
export type NotificationListParams = z.infer<typeof NotificationListParamsSchema>;
