import { z } from 'zod';
import {
  type AskChatbotQuestionRequest,
  AskChatbotQuestionRequestSchema,
  type CancelServiceOrderRequest,
  CancelServiceOrderRequestSchema,
  type ChangePasswordRequest,
  ChangePasswordRequestSchema,
  type ChatbotAnswerResponse,
  ChatbotAnswerResponseSchema,
  ChatbotMessagePageSchema,
  type ChatbotMessageResponse,
  type ChatbotMessagesParams,
  ChatbotMessagesParamsSchema,
  type CreateNegativePreviewSessionData,
  CreateNegativePreviewSessionDataSchema,
  type CreatePreviewPrintOrderRequest,
  CreatePreviewPrintOrderRequestSchema,
  type CreateServiceOrderRequest,
  CreateServiceOrderRequestSchema,
  type DeletePushTokenRequest,
  DeletePushTokenRequestSchema,
  type FilmArchiveRollResponse,
  FilmArchiveRollResponseSchema,
  FilmArchiveRollSummaryPageSchema,
  type FilmArchiveRollSummaryResponse,
  type FilmFormatResponse,
  FilmFormatResponseSchema,
  type FilmProcessResponse,
  FilmProcessResponseSchema,
  type FilmStockResponse,
  FilmStockResponseSchema,
  type ForgotPasswordRequest,
  ForgotPasswordRequestSchema,
  type GenerateNegativePreviewRequest,
  GenerateNegativePreviewRequestSchema,
  type LabPrintPriceTierResponse,
  LabPrintPriceTierResponseSchema,
  type LoginRequest,
  LoginRequestSchema,
  type LogoutRequest,
  LogoutRequestSchema,
  type NegativePreviewDownloadResponse,
  NegativePreviewDownloadResponseSchema,
  type NegativePreviewSessionListParams,
  NegativePreviewSessionListParamsSchema,
  type NegativePreviewSessionResponse,
  NegativePreviewSessionResponseSchema,
  NegativePreviewSessionSummaryPageSchema,
  type NegativePreviewSessionSummaryResponse,
  type NotificationItemResponse,
  NotificationItemResponseSchema,
  type NotificationListParams,
  NotificationListParamsSchema,
  NotificationPageSchema,
  type PageResponse,
  PositiveIdSchema,
  type PreviewPrintOrderQuoteResponse,
  PreviewPrintOrderQuoteResponseSchema,
  type PrintSizeResponse,
  PrintSizeResponseSchema,
  type PublicFilmLabResponse,
  PublicFilmLabResponseSchema,
  type PublicFilmLabSearchParams,
  PublicFilmLabSearchParamsSchema,
  PublicFilmLabSummaryPageSchema,
  type PublicFilmLabSummaryResponse,
  type QuotePreviewPrintOrderRequest,
  QuotePreviewPrintOrderRequestSchema,
  type RefreshTokenRequest,
  RefreshTokenRequestSchema,
  type RegisterPushTokenRequest,
  RegisterPushTokenRequestSchema,
  type RegisterRequest,
  RegisterRequestSchema,
  type ResendOtpRequest,
  ResendOtpRequestSchema,
  type ResetPasswordRequest,
  ResetPasswordRequestSchema,
  type ResetTokenResponse,
  ResetTokenResponseSchema,
  type ScheduleChangeAnswerRequest,
  ScheduleChangeAnswerRequestSchema,
  type SearchFilmArchiveParams,
  SearchFilmArchiveParamsSchema,
  type ServiceOrderDetailResponse,
  ServiceOrderDetailResponseSchema,
  type ServiceOrderListParams,
  ServiceOrderListParamsSchema,
  type ServiceOrderQuoteResponse,
  ServiceOrderQuoteResponseSchema,
  type ServiceOrderResponse,
  ServiceOrderResponseSchema,
  ServiceOrderSummaryPageSchema,
  type ServiceOrderSummaryResponse,
  type ServiceTypeResponse,
  ServiceTypeResponseSchema,
  type SubmitServiceOrderRequest,
  SubmitServiceOrderRequestSchema,
  type UnlockNegativePreviewDownloadRequest,
  UnlockNegativePreviewDownloadRequestSchema,
  type UnlockNegativePreviewDownloadResponse,
  UnlockNegativePreviewDownloadResponseSchema,
  type UnreadNotificationCountResponse,
  UnreadNotificationCountResponseSchema,
  type UserAccountResponse,
  UserAccountResponseSchema,
  type VerifyEmailRequest,
  VerifyEmailRequestSchema,
  type VerifyPasswordResetOtpRequest,
  VerifyPasswordResetOtpRequestSchema,
  type VnpaySandboxUrlRequest,
  VnpaySandboxUrlRequestSchema,
  type VnpaySandboxUrlResponse,
  VnpaySandboxUrlResponseSchema,
} from './contracts';
import { type HttpClient, type MultipartFile, NoContentSchema } from './http';
import { type TokenResponse, TokenResponseSchema } from './session';

const FilmFormatListSchema = z.array(FilmFormatResponseSchema);
const FilmProcessListSchema = z.array(FilmProcessResponseSchema);
const ServiceTypeListSchema = z.array(ServiceTypeResponseSchema);
const FilmStockListSchema = z.array(FilmStockResponseSchema);
const PrintSizeListSchema = z.array(PrintSizeResponseSchema);
const LabPrintPriceTierListSchema = z.array(LabPrintPriceTierResponseSchema);

export type FilmLinkApi = {
  readonly register: (payload: RegisterRequest) => Promise<UserAccountResponse>;
  readonly verifyEmail: (payload: VerifyEmailRequest) => Promise<TokenResponse>;
  readonly resendOtp: (payload: ResendOtpRequest) => Promise<undefined>;
  readonly login: (payload: LoginRequest) => Promise<TokenResponse>;
  readonly refresh: (payload: RefreshTokenRequest) => Promise<TokenResponse>;
  readonly logout: (payload: LogoutRequest) => Promise<undefined>;
  readonly forgotPassword: (payload: ForgotPasswordRequest) => Promise<undefined>;
  readonly verifyPasswordResetOtp: (
    payload: VerifyPasswordResetOtpRequest,
  ) => Promise<ResetTokenResponse>;
  readonly resetPassword: (payload: ResetPasswordRequest) => Promise<undefined>;
  readonly getMyAccount: () => Promise<UserAccountResponse>;
  readonly changeMyPassword: (payload: ChangePasswordRequest) => Promise<undefined>;
  readonly fetchFilmFormats: () => Promise<readonly FilmFormatResponse[]>;
  readonly fetchFilmProcesses: () => Promise<readonly FilmProcessResponse[]>;
  readonly fetchServiceTypes: () => Promise<readonly ServiceTypeResponse[]>;
  readonly searchFilmStocks: (query?: string) => Promise<readonly FilmStockResponse[]>;
  readonly searchPublicFilmLabs: (
    params?: PublicFilmLabSearchParams,
  ) => Promise<PageResponse<PublicFilmLabSummaryResponse>>;
  readonly fetchPublicFilmLabDetail: (labId: number) => Promise<PublicFilmLabResponse>;
  readonly fetchServiceOrders: (
    params?: ServiceOrderListParams,
  ) => Promise<PageResponse<ServiceOrderSummaryResponse>>;
  readonly fetchServiceOrderDetail: (orderId: number) => Promise<ServiceOrderDetailResponse>;
  readonly quoteServiceOrder: (
    payload: CreateServiceOrderRequest,
  ) => Promise<ServiceOrderQuoteResponse>;
  readonly createServiceOrderRequest: (
    payload: SubmitServiceOrderRequest,
  ) => Promise<ServiceOrderResponse>;
  readonly answerScheduleChange: (
    orderId: number,
    changeId: number,
    payload: ScheduleChangeAnswerRequest,
  ) => Promise<undefined>;
  readonly confirmServiceOrderReceipt: (orderId: number) => Promise<ServiceOrderDetailResponse>;
  readonly cancelServiceOrder: (
    orderId: number,
    payload: CancelServiceOrderRequest,
  ) => Promise<ServiceOrderDetailResponse>;
  readonly fetchFilmArchive: (
    params?: SearchFilmArchiveParams,
  ) => Promise<PageResponse<FilmArchiveRollSummaryResponse>>;
  readonly fetchArchiveRollDetail: (archiveRollId: number) => Promise<FilmArchiveRollResponse>;
  readonly askChatbotQuestion: (
    payload: AskChatbotQuestionRequest,
  ) => Promise<ChatbotAnswerResponse>;
  readonly fetchChatbotSessionMessages: (
    sessionId: number,
    params?: ChatbotMessagesParams,
  ) => Promise<PageResponse<ChatbotMessageResponse>>;
  readonly createVnpaySandboxUrl: (
    payload: VnpaySandboxUrlRequest,
  ) => Promise<VnpaySandboxUrlResponse>;
  readonly fetchNotifications: (
    params?: NotificationListParams,
  ) => Promise<PageResponse<NotificationItemResponse>>;
  readonly fetchUnreadNotificationCount: () => Promise<UnreadNotificationCountResponse>;
  readonly markNotificationRead: (notificationId: number) => Promise<NotificationItemResponse>;
  readonly markAllNotificationsRead: () => Promise<undefined>;
  readonly registerPushToken: (payload: RegisterPushTokenRequest) => Promise<undefined>;
  readonly deletePushToken: (payload: DeletePushTokenRequest) => Promise<undefined>;
  readonly createNegativePreviewSession: (
    data: CreateNegativePreviewSessionData,
    file?: MultipartFile,
  ) => Promise<NegativePreviewSessionResponse>;
  readonly generateNegativePreview: (
    sessionId: number,
    payload: GenerateNegativePreviewRequest,
  ) => Promise<NegativePreviewSessionResponse>;
  readonly fetchNegativePreviewSessions: (
    params?: NegativePreviewSessionListParams,
  ) => Promise<PageResponse<NegativePreviewSessionSummaryResponse>>;
  readonly fetchNegativePreviewSession: (
    sessionId: number,
  ) => Promise<NegativePreviewSessionResponse>;
  readonly unlockNegativePreviewDownload: (
    sessionId: number,
    payload?: UnlockNegativePreviewDownloadRequest,
  ) => Promise<UnlockNegativePreviewDownloadResponse>;
  readonly fetchNegativePreviewDownload: (
    sessionId: number,
  ) => Promise<NegativePreviewDownloadResponse>;
  readonly fetchPrintSizes: () => Promise<readonly PrintSizeResponse[]>;
  readonly fetchLabPrintPrices: (labId: number) => Promise<readonly LabPrintPriceTierResponse[]>;
  readonly quoteNegativePreviewPrintOrder: (
    sessionId: number,
    payload: QuotePreviewPrintOrderRequest,
  ) => Promise<PreviewPrintOrderQuoteResponse>;
  readonly createNegativePreviewPrintOrder: (
    sessionId: number,
    payload: CreatePreviewPrintOrderRequest,
  ) => Promise<ServiceOrderResponse>;
};

export function createFilmLinkApi(client: HttpClient): FilmLinkApi {
  return {
    register: (payload) =>
      client.post(
        '/auth/register',
        RegisterRequestSchema.parse(payload),
        UserAccountResponseSchema,
        {
          auth: false,
        },
      ),
    verifyEmail: (payload) =>
      client.post(
        '/auth/verify-email',
        VerifyEmailRequestSchema.parse(payload),
        TokenResponseSchema,
        {
          auth: false,
        },
      ),
    resendOtp: (payload) =>
      client.post('/auth/resend-otp', ResendOtpRequestSchema.parse(payload), NoContentSchema, {
        auth: false,
      }),
    login: (payload) =>
      client.post('/auth/login', LoginRequestSchema.parse(payload), TokenResponseSchema, {
        auth: false,
      }),
    refresh: (payload) =>
      client.post('/auth/refresh', RefreshTokenRequestSchema.parse(payload), TokenResponseSchema, {
        auth: false,
      }),
    logout: (payload) =>
      client.post('/auth/logout', LogoutRequestSchema.parse(payload), NoContentSchema),
    forgotPassword: (payload) =>
      client.post(
        '/auth/forgot-password',
        ForgotPasswordRequestSchema.parse(payload),
        NoContentSchema,
        { auth: false },
      ),
    verifyPasswordResetOtp: (payload) =>
      client.post(
        '/auth/verify-password-reset-otp',
        VerifyPasswordResetOtpRequestSchema.parse(payload),
        ResetTokenResponseSchema,
        { auth: false },
      ),
    resetPassword: (payload) =>
      client.post(
        '/auth/reset-password',
        ResetPasswordRequestSchema.parse(payload),
        NoContentSchema,
        {
          auth: false,
        },
      ),
    getMyAccount: () => client.get('/accounts/me', UserAccountResponseSchema),
    changeMyPassword: (payload) =>
      client.put(
        '/accounts/me/password',
        ChangePasswordRequestSchema.parse(payload),
        NoContentSchema,
      ),
    fetchFilmFormats: () => client.get('/film-formats', FilmFormatListSchema, { auth: false }),
    fetchFilmProcesses: () => client.get('/film-processes', FilmProcessListSchema, { auth: false }),
    fetchServiceTypes: () => client.get('/service-types', ServiceTypeListSchema, { auth: false }),
    searchFilmStocks: (query) => {
      const trimmed = query?.trim();
      return client.get('/film-stocks', FilmStockListSchema, {
        auth: false,
        query: trimmed ? { q: trimmed } : undefined,
      });
    },
    searchPublicFilmLabs: (params) => {
      const query = PublicFilmLabSearchParamsSchema.parse(params ?? {});
      return client.get('/public/film-labs', PublicFilmLabSummaryPageSchema, {
        auth: false,
        query,
      });
    },
    fetchPublicFilmLabDetail: (labId) => {
      const id = PositiveIdSchema.parse(labId);
      return client.get(`/public/film-labs/${id}`, PublicFilmLabResponseSchema, { auth: false });
    },
    fetchServiceOrders: (params) => {
      const query = ServiceOrderListParamsSchema.parse(params ?? {});
      return client.get('/orders', ServiceOrderSummaryPageSchema, { query });
    },
    fetchServiceOrderDetail: (orderId) => {
      const id = PositiveIdSchema.parse(orderId);
      return client.get(`/orders/${id}`, ServiceOrderDetailResponseSchema);
    },
    quoteServiceOrder: (payload) =>
      client.post(
        '/orders/quote',
        CreateServiceOrderRequestSchema.parse(payload),
        ServiceOrderQuoteResponseSchema,
      ),
    createServiceOrderRequest: (payload) =>
      client.post(
        '/orders',
        SubmitServiceOrderRequestSchema.parse(payload),
        ServiceOrderResponseSchema,
      ),
    answerScheduleChange: (orderId, changeId, payload) => {
      const safeOrderId = PositiveIdSchema.parse(orderId);
      const safeChangeId = PositiveIdSchema.parse(changeId);
      return client.post(
        `/orders/${safeOrderId}/schedule-changes/${safeChangeId}/answer`,
        ScheduleChangeAnswerRequestSchema.parse(payload),
        NoContentSchema,
      );
    },
    confirmServiceOrderReceipt: (orderId) => {
      const id = PositiveIdSchema.parse(orderId);
      return client.post(`/orders/${id}/confirm-receipt`, {}, ServiceOrderDetailResponseSchema);
    },
    cancelServiceOrder: (orderId, payload) => {
      const id = PositiveIdSchema.parse(orderId);
      return client.post(
        `/orders/${id}/cancel`,
        CancelServiceOrderRequestSchema.parse(payload),
        ServiceOrderDetailResponseSchema,
      );
    },
    fetchFilmArchive: (params) => {
      const query = SearchFilmArchiveParamsSchema.parse(params ?? {});
      return client.get('/me/archive', FilmArchiveRollSummaryPageSchema, { query });
    },
    fetchArchiveRollDetail: (archiveRollId) => {
      const id = PositiveIdSchema.parse(archiveRollId);
      return client.get(`/me/archive/rolls/${id}`, FilmArchiveRollResponseSchema);
    },
    askChatbotQuestion: (payload) =>
      client.post(
        '/chatbot/questions',
        AskChatbotQuestionRequestSchema.parse(payload),
        ChatbotAnswerResponseSchema,
      ),
    fetchChatbotSessionMessages: (sessionId, params) => {
      const id = PositiveIdSchema.parse(sessionId);
      const query = ChatbotMessagesParamsSchema.parse(params ?? {});
      return client.get(`/chatbot/sessions/${id}/messages`, ChatbotMessagePageSchema, { query });
    },
    createVnpaySandboxUrl: (payload) =>
      client.post(
        '/payments/vnpay/sandbox-url',
        VnpaySandboxUrlRequestSchema.parse(payload),
        VnpaySandboxUrlResponseSchema,
      ),
    fetchNotifications: (params) => {
      const query = NotificationListParamsSchema.parse(params ?? {});
      return client.get('/notifications', NotificationPageSchema, { query });
    },
    fetchUnreadNotificationCount: () =>
      client.get('/notifications/unread-count', UnreadNotificationCountResponseSchema),
    markNotificationRead: (notificationId) => {
      const id = PositiveIdSchema.parse(notificationId);
      return client.patch(`/notifications/${id}/read`, {}, NotificationItemResponseSchema);
    },
    markAllNotificationsRead: () => client.post('/notifications/read-all', {}, NoContentSchema),
    registerPushToken: (payload) =>
      client.post(
        '/notifications/push-tokens',
        RegisterPushTokenRequestSchema.parse(payload),
        NoContentSchema,
      ),
    deletePushToken: (payload) => {
      const { fcmToken } = DeletePushTokenRequestSchema.parse(payload);
      return client.del('/notifications/push-tokens', NoContentSchema, { query: { fcmToken } });
    },
    createNegativePreviewSession: (data, file) =>
      client.multipartPost(
        '/ai/negative-previews/sessions',
        {
          data: CreateNegativePreviewSessionDataSchema.parse(data),
          files: file ? [{ ...file, field: 'file' }] : [],
        },
        NegativePreviewSessionResponseSchema,
      ),
    generateNegativePreview: (sessionId, payload) => {
      const id = PositiveIdSchema.parse(sessionId);
      return client.post(
        `/ai/negative-previews/sessions/${id}/generate`,
        GenerateNegativePreviewRequestSchema.parse(payload),
        NegativePreviewSessionResponseSchema,
      );
    },
    fetchNegativePreviewSessions: (params) => {
      const query = NegativePreviewSessionListParamsSchema.parse(params ?? {});
      return client.get('/ai/negative-previews/sessions', NegativePreviewSessionSummaryPageSchema, {
        query,
      });
    },
    fetchNegativePreviewSession: (sessionId) => {
      const id = PositiveIdSchema.parse(sessionId);
      return client.get(
        `/ai/negative-previews/sessions/${id}`,
        NegativePreviewSessionResponseSchema,
      );
    },
    unlockNegativePreviewDownload: (sessionId, payload = {}) => {
      const id = PositiveIdSchema.parse(sessionId);
      return client.post(
        `/ai/negative-previews/sessions/${id}/unlock-download`,
        UnlockNegativePreviewDownloadRequestSchema.parse(payload),
        UnlockNegativePreviewDownloadResponseSchema,
      );
    },
    fetchNegativePreviewDownload: (sessionId) => {
      const id = PositiveIdSchema.parse(sessionId);
      return client.get(
        `/ai/negative-previews/sessions/${id}/download`,
        NegativePreviewDownloadResponseSchema,
      );
    },
    fetchPrintSizes: () => client.get('/public/print-sizes', PrintSizeListSchema, { auth: false }),
    fetchLabPrintPrices: (labId) => {
      const id = PositiveIdSchema.parse(labId);
      return client.get(`/public/film-labs/${id}/print-prices`, LabPrintPriceTierListSchema, {
        auth: false,
      });
    },
    quoteNegativePreviewPrintOrder: (sessionId, payload) => {
      const id = PositiveIdSchema.parse(sessionId);
      return client.post(
        `/ai/negative-previews/sessions/${id}/print-orders/quote`,
        QuotePreviewPrintOrderRequestSchema.parse(payload),
        PreviewPrintOrderQuoteResponseSchema,
      );
    },
    createNegativePreviewPrintOrder: (sessionId, payload) => {
      const id = PositiveIdSchema.parse(sessionId);
      return client.post(
        `/ai/negative-previews/sessions/${id}/print-orders`,
        CreatePreviewPrintOrderRequestSchema.parse(payload),
        ServiceOrderResponseSchema,
      );
    },
  };
}
