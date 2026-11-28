import type {
  CreatePreviewPrintOrderRequest,
  DetectedFilmBaseType,
  DownloadUnlockType,
  LabPrintPriceTierResponse,
  NegativePreviewSessionResponse,
  NegativePreviewStatus,
  PrintSizeResponse,
  QuotePreviewPrintOrderRequest,
} from '@/shared/api';
import {
  CatalogStatus,
  ErrorCode,
  HandoverMethod,
  type NegativePreviewDraft,
  PaymentMethod,
  type PrintOrderDraft,
  validatePhoneNumber,
} from '@/shared/domain';
import {
  getErrorMessage,
  hasErrorCode,
  isNetworkError,
  normalizeProblemDetail,
} from '@/shared/lib';

export const INTENT_PROMPT_MIN_LENGTH = 3;
export const INTENT_PROMPT_MAX_LENGTH = 500;
export const PRINT_QUANTITY_MIN = 1;
export const PRINT_QUANTITY_MAX = 500;
export const PRINT_ADDRESS_MAX_LENGTH = 255;
export const PRINT_DISTRICT_MAX_LENGTH = 100;
export const PRINT_PROVINCE_MAX_LENGTH = 100;
export const PRINT_NOTE_MAX_LENGTH = 300;
export const DEFAULT_MAX_REGENERATIONS = 3;

export const ALLOWED_NEGATIVE_PREVIEW_CONTROLS = [
  'intent-prompt',
  'style-chips',
  'compare-toggle',
] as const;

export type AllowedNegativePreviewControl = (typeof ALLOWED_NEGATIVE_PREVIEW_CONTROLS)[number];

export type NegativePreviewStep = 'source' | 'intent' | 'preview' | 'print';
export type NegativeCompareMode = 'positive' | 'negative';

export const DETECTED_BASE_TYPE_LABELS: Record<DetectedFilmBaseType, string> = {
  C41_COLOR_NEGATIVE: 'Âm bản màu C-41',
  BW_NEGATIVE: 'Âm bản đen trắng (B&W)',
  ECN2_CINEMA: 'Âm bản điện ảnh ECN-2',
  E6_SLIDE: 'Phim dương bản / Slide E-6',
  UNKNOWN: 'Chưa xác định loại phim',
};

export const PREVIEW_STATUS_LABELS: Record<NegativePreviewStatus, string> = {
  ANALYZING: 'Đang phân tích âm bản',
  AWAITING_INTENT: 'Chờ mô tả phong cách',
  GENERATING: 'Đang tạo dương bản AI',
  READY: 'Đã có bản xem thử',
  FAILED: 'Xử lý thất bại',
  EXPIRED: 'Phiên đã hết hạn',
};

export const DOWNLOAD_UNLOCK_LABELS: Record<DownloadUnlockType, string> = {
  LOCKED: 'Bản xem thử có watermark',
  FREE_QUOTA: 'Đã mở khóa ảnh gốc (Miễn phí)',
  PAID: 'Đã mở khóa ảnh gốc (VNPay)',
};

export const INITIAL_NEGATIVE_PREVIEW_DRAFT: NegativePreviewDraft = {
  sessionId: null,
  sourceType: 'UPLOADED_NEGATIVE',
  scanFileId: null,
  localFileUri: null,
  localFileName: null,
  localFileMimeType: null,
  localFileSizeBytes: null,
  intentPrompt: '',
  selectedStyleCode: null,
};

export const INITIAL_PRINT_ORDER_DRAFT: PrintOrderDraft = {
  sessionId: null,
  filmLabId: null,
  printSizeId: null,
  quantity: PRINT_QUANTITY_MIN,
  filmHandoverMethod: HandoverMethod.SELF_DROP_OFF,
  paymentMethod: PaymentMethod.PAY_AT_LAB,
  customerAddressLine: '',
  customerDistrict: '',
  customerProvince: '',
  customerPhone: '',
  note: '',
};

const NEGATIVE_PREVIEW_ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.AI_PREVIEW_SESSION_NOT_FOUND]:
    'Phiên xem thử dương bản không tồn tại hoặc đã hết hạn.',
  [ErrorCode.AI_PREVIEW_SESSION_EXPIRED]:
    'Phiên xem thử dương bản đã hết hạn. Vui lòng tạo phiên mới.',
  [ErrorCode.AI_PREVIEW_REGENERATION_LIMIT_REACHED]:
    'Bạn đã dùng hết tối đa 3 lượt tinh chỉnh cho phiên này.',
  [ErrorCode.AI_PREVIEW_DOWNLOAD_LOCKED]:
    'Ảnh dương bản độ phân giải cao chưa được mở khóa tải xuống.',
  [ErrorCode.AI_PREVIEW_FREE_QUOTA_EXCEEDED]:
    'Bạn đã hết lượt mở khóa miễn phí hôm nay. Vui lòng mở khóa qua VNPay.',
  [ErrorCode.PRINT_SIZE_NOT_SUPPORTED_BY_LAB]:
    'Phòng Lab đã chọn hiện không hỗ trợ khổ ảnh in này.',
  [ErrorCode.SCAN_FILE_NOT_FOUND]: 'Không tìm thấy khung ảnh lưu trữ đã chọn.',
  [ErrorCode.STORAGE_FILE_TYPE_NOT_ALLOWED]: 'Chỉ hỗ trợ tệp ảnh âm bản định dạng JPEG hoặc PNG.',
  [ErrorCode.STORAGE_FILE_TOO_LARGE]: 'Dung lượng ảnh âm bản vượt quá giới hạn tối đa 10 MB.',
  [ErrorCode.STORAGE_LINK_INVALID]: 'Liên kết ảnh xem trước đã hết hạn. Vui lòng làm mới phiên.',
  [ErrorCode.STORAGE_UNAVAILABLE]: 'Hệ thống lưu trữ ảnh đang tạm gián đoạn. Vui lòng thử lại sau.',
  [ErrorCode.AI_PROVIDER_UNAVAILABLE]:
    'Dịch vụ xử lý AI đang quá tải hoặc gián đoạn. Vui lòng thử lại sau.',
  [ErrorCode.PAYMENT_GATEWAY_NOT_CONFIGURED]:
    'Cổng thanh toán VNPay hiện chưa sẵn sàng. Vui lòng thử lại sau.',
  [ErrorCode.AUTHENTICATION_REQUIRED]: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  [ErrorCode.LAB_NOT_FOUND]: 'Không tìm thấy Phòng Lab đã chọn.',
  [ErrorCode.ORDER_LAB_NOT_ACCEPTING]: 'Phòng Lab hiện tạm ngừng nhận đơn in mới.',
  [ErrorCode.CONCURRENT_UPDATE_CONFLICT]: 'Dữ liệu đơn hàng vừa được cập nhật. Vui lòng thử lại.',
  [ErrorCode.VALIDATION_ERROR]: 'Thông tin gửi lên chưa hợp lệ. Vui lòng kiểm tra lại.',
};

export function isNegativePreviewDraftEmpty(draft: NegativePreviewDraft): boolean {
  return (
    draft.sessionId === null &&
    draft.scanFileId === null &&
    draft.localFileUri === null &&
    draft.intentPrompt.trim().length === 0 &&
    draft.selectedStyleCode === null
  );
}

export function isPrintOrderDraftEmpty(draft: PrintOrderDraft): boolean {
  return (
    draft.filmLabId === null &&
    draft.printSizeId === null &&
    draft.quantity === PRINT_QUANTITY_MIN &&
    draft.filmHandoverMethod === HandoverMethod.SELF_DROP_OFF &&
    draft.paymentMethod === PaymentMethod.PAY_AT_LAB &&
    draft.customerAddressLine.trim().length === 0 &&
    draft.customerDistrict.trim().length === 0 &&
    draft.customerProvince.trim().length === 0 &&
    draft.customerPhone.trim().length === 0 &&
    draft.note.trim().length === 0
  );
}

export function resolveInitialStep(
  session: NegativePreviewSessionResponse | null | undefined,
  printOpen: boolean,
): NegativePreviewStep {
  if (!session) {
    return 'source';
  }
  const hasPreview = session.status === 'READY' || session.previewWatermarkedUrl !== null;
  if (printOpen && hasPreview) {
    return 'print';
  }
  if (hasPreview || session.turns.length > 0) {
    return 'preview';
  }
  return 'intent';
}

export function canRegeneratePreview(session: NegativePreviewSessionResponse): boolean {
  return session.status !== 'EXPIRED' && session.regenerationCount < session.maxRegenerations;
}

export function remainingRegenerations(session: NegativePreviewSessionResponse): number {
  return Math.max(0, session.maxRegenerations - session.regenerationCount);
}

export function isDownloadUnlocked(
  session: Pick<NegativePreviewSessionResponse, 'downloadUnlockType'>,
): boolean {
  return session.downloadUnlockType === 'FREE_QUOTA' || session.downloadUnlockType === 'PAID';
}

export function validateIntentPrompt(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (trimmed.length < INTENT_PROMPT_MIN_LENGTH) {
    return `Vui lòng nhập mô tả phong cách tối thiểu ${INTENT_PROMPT_MIN_LENGTH} ký tự.`;
  }
  if (trimmed.length > INTENT_PROMPT_MAX_LENGTH) {
    return `Mô tả phong cách không được vượt quá ${INTENT_PROMPT_MAX_LENGTH} ký tự.`;
  }
  return null;
}

export function clampPrintQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return PRINT_QUANTITY_MIN;
  }
  const rounded = Math.round(value);
  return Math.min(PRINT_QUANTITY_MAX, Math.max(PRINT_QUANTITY_MIN, rounded));
}

export function resolvePrintUnitPriceVnd(
  tiers: readonly LabPrintPriceTierResponse[],
  printSizeId: number,
  quantity: number,
): number | null {
  const safeQuantity = clampPrintQuantity(quantity);
  let bestTier: LabPrintPriceTierResponse | undefined;
  for (const tier of tiers) {
    if (tier.printSizeId !== printSizeId || tier.minQuantity > safeQuantity) {
      continue;
    }
    if (!bestTier || tier.minQuantity > bestTier.minQuantity) {
      bestTier = tier;
    }
  }
  return bestTier ? bestTier.unitPriceVnd : null;
}

export function filterSupportedPrintSizes(
  sizes: readonly PrintSizeResponse[],
  tiers: readonly LabPrintPriceTierResponse[],
): readonly PrintSizeResponse[] {
  const supportedIds = new Set(tiers.map((tier) => tier.printSizeId));
  return sizes.filter((size) => size.status === CatalogStatus.ACTIVE && supportedIds.has(size.id));
}

function validateHandoverShippingFields(draft: PrintOrderDraft): string | null {
  const addressLine = draft.customerAddressLine.trim();
  if (!addressLine) {
    return 'Vui lòng nhập địa chỉ giao nhận ảnh in.';
  }
  if (addressLine.length > PRINT_ADDRESS_MAX_LENGTH) {
    return `Địa chỉ giao nhận không được vượt quá ${PRINT_ADDRESS_MAX_LENGTH} ký tự.`;
  }
  const district = draft.customerDistrict.trim();
  if (!district) {
    return 'Vui lòng nhập quận/huyện giao nhận.';
  }
  if (district.length > PRINT_DISTRICT_MAX_LENGTH) {
    return `Quận/huyện giao nhận không được vượt quá ${PRINT_DISTRICT_MAX_LENGTH} ký tự.`;
  }
  const province = draft.customerProvince.trim();
  if (!province) {
    return 'Vui lòng nhập tỉnh/thành phố giao nhận.';
  }
  if (province.length > PRINT_PROVINCE_MAX_LENGTH) {
    return `Tỉnh/thành phố giao nhận không được vượt quá ${PRINT_PROVINCE_MAX_LENGTH} ký tự.`;
  }
  return validatePhoneNumber(draft.customerPhone.replace(/\s+/g, ''), true);
}

export function validatePrintOrderForm(draft: PrintOrderDraft): string | null {
  if (draft.filmLabId === null) {
    return 'Vui lòng chọn Phòng Lab thực hiện in ảnh.';
  }
  if (draft.printSizeId === null) {
    return 'Vui lòng chọn khổ ảnh in.';
  }
  if (
    !Number.isInteger(draft.quantity) ||
    draft.quantity < PRINT_QUANTITY_MIN ||
    draft.quantity > PRINT_QUANTITY_MAX
  ) {
    return `Số lượng ảnh in phải từ ${PRINT_QUANTITY_MIN} đến ${PRINT_QUANTITY_MAX}.`;
  }
  if (draft.filmHandoverMethod !== HandoverMethod.SELF_DROP_OFF) {
    const shippingError = validateHandoverShippingFields(draft);
    if (shippingError) {
      return shippingError;
    }
  }
  if (draft.note.trim().length > PRINT_NOTE_MAX_LENGTH) {
    return `Ghi chú đơn in không được vượt quá ${PRINT_NOTE_MAX_LENGTH} ký tự.`;
  }
  return null;
}

export function buildQuotePrintOrderPayload(draft: PrintOrderDraft): QuotePreviewPrintOrderRequest {
  if (draft.filmLabId === null || draft.printSizeId === null) {
    throw new Error('Vui lòng chọn Phòng Lab và khổ ảnh in.');
  }
  const trimmedNote = draft.note.trim();
  const basePayload: QuotePreviewPrintOrderRequest = {
    filmLabId: draft.filmLabId,
    printSizeId: draft.printSizeId,
    quantity: clampPrintQuantity(draft.quantity),
    filmHandoverMethod: draft.filmHandoverMethod,
    ...(trimmedNote ? { note: trimmedNote } : {}),
  };

  if (draft.filmHandoverMethod === HandoverMethod.SELF_DROP_OFF) {
    return basePayload;
  }

  const addressLine = draft.customerAddressLine.trim();
  const district = draft.customerDistrict.trim();
  const province = draft.customerProvince.trim();
  const phone = draft.customerPhone.replace(/\s+/g, '');

  return {
    ...basePayload,
    ...(addressLine ? { customerAddressLine: addressLine } : {}),
    ...(district ? { customerDistrict: district } : {}),
    ...(province ? { customerProvince: province } : {}),
    ...(phone ? { customerPhone: phone } : {}),
  };
}

export function buildCreatePrintOrderPayload(
  draft: PrintOrderDraft,
  idempotencyKey: string,
): CreatePreviewPrintOrderRequest {
  return {
    ...buildQuotePrintOrderPayload(draft),
    idempotencyKey,
    paymentMethod: draft.paymentMethod,
  };
}

export function isNegativePreviewSignedUrlError(error: unknown): boolean {
  return hasErrorCode(error, ErrorCode.STORAGE_LINK_INVALID);
}

export function mapNegativePreviewApiError(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Không thể kết nối tới máy chủ FilmLink. Vui lòng kiểm tra kết nối mạng.';
  }
  const problem = normalizeProblemDetail(error);
  if (problem.errorCode === ErrorCode.AI_NEGATIVE_INVALID_IMAGE) {
    const detail = problem.detail.trim();
    if (detail.length > 0) {
      return /âm bản/i.test(detail) ? detail : `Ảnh không phải âm bản phim hợp lệ: ${detail}`;
    }
    return 'Ảnh tải lên không phải âm bản phim hợp lệ. Vui lòng chụp lại rõ khung phim.';
  }
  if (problem.errorCode) {
    const mapped = NEGATIVE_PREVIEW_ERROR_MESSAGES[problem.errorCode];
    if (mapped) {
      return mapped;
    }
  }
  if (problem.errorCode === 'HTTP_404' || (problem.status === 404 && !problem.errorCode)) {
    return 'Tính năng xem thử dương bản AI đang chờ cập nhật từ máy chủ FilmLink.';
  }
  if (problem.status === 401) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  }
  return getErrorMessage(error);
}
