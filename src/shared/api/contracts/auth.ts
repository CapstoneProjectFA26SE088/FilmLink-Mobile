import { z } from 'zod';
import { AccountStatus, MAX_PASSWORD_LENGTH, OtpPurpose, Role } from '@/shared/domain';
import {
  IsoTimestampSchema,
  OtpCodeSchema,
  PasswordComplexitySchema,
  PositiveIdSchema,
  VnPhoneSchema,
} from './common';

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
