import { env } from '@/shared/config';
import { createFilmLinkApi } from './endpoints';
import { createHttpClient } from './http';
import { createPlatformSecureStore, createSessionStorage } from './session';
import { createSessionManager } from './session-manager';

export * from './contracts';
export { createFilmLinkApi, type FilmLinkApi } from './endpoints';
export {
  buildMultipartFormData,
  buildQueryString,
  createHttpClient,
  type FetchFn,
  type HttpClient,
  type MultipartFile,
  type MultipartParts,
  NoContentSchema,
  type QueryParams,
  type RequestConfig,
  ResponseShapeError,
  type TokenProvider,
} from './http';
export {
  createQueryClient,
  DEFAULT_GC_TIME_MS,
  PRIVATE_QUERY_ROOTS,
  purgePrivateQueryCache,
  shouldRetryQuery,
} from './query-client';
export {
  CATALOG_STALE_TIME_MS,
  filmLinkQueryKeys,
  ORDER_STALE_TIME_MS,
  SIGNED_URL_STALE_TIME_MS,
} from './query-keys';
export {
  type AuthSession,
  AuthSessionSchema,
  createMemorySecureStore,
  createSessionStorage,
  decodeAccessTokenClaims,
  isAccessTokenExpired,
  isSupportedMobileRole,
  type SecureKeyValueStore,
  type SessionStorage,
  SUPPORTED_MOBILE_ROLES,
  type SupportedMobileRole,
  sessionFromTokenResponse,
  type TokenResponse,
  TokenResponseSchema,
} from './session';
export {
  createSessionManager,
  REFRESH_PATH,
  type SessionEndReason,
  type SessionListener,
  type SessionManager,
} from './session-manager';
export { createSingleFlight, type SingleFlight } from './single-flight';

export const sessionManager = createSessionManager({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  storage: createSessionStorage(createPlatformSecureStore()),
});

export const apiClient = createHttpClient({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  tokenProvider: sessionManager,
});

export const filmLinkApi = createFilmLinkApi(apiClient);

export const {
  register,
  verifyEmail,
  resendOtp,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  getMyAccount,
  changeMyPassword,
  fetchFilmFormats,
  fetchFilmProcesses,
  fetchServiceTypes,
  searchFilmStocks,
  searchPublicFilmLabs,
  fetchPublicFilmLabDetail,
  fetchServiceOrders,
  fetchServiceOrderDetail,
  quoteServiceOrder,
  createServiceOrderRequest,
  answerScheduleChange,
  confirmServiceOrderReceipt,
  cancelServiceOrder,
  fetchFilmArchive,
  fetchArchiveRollDetail,
  askChatbotQuestion,
  fetchChatbotSessionMessages,
  createVnpaySandboxUrl,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  registerPushToken,
  deletePushToken,
  createNegativePreviewSession,
  generateNegativePreview,
  fetchNegativePreviewSessions,
  fetchNegativePreviewSession,
  unlockNegativePreviewDownload,
  fetchNegativePreviewDownload,
  fetchPrintSizes,
  fetchLabPrintPrices,
  quoteNegativePreviewPrintOrder,
  createNegativePreviewPrintOrder,
} = filmLinkApi;
