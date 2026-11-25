export const Role = {
  PHOTOGRAPHER: 'PHOTOGRAPHER',
  PHOTOGRAPHY_EXPERT: 'PHOTOGRAPHY_EXPERT',
  FILM_LAB_OWNER: 'FILM_LAB_OWNER',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof Role)[keyof typeof Role];
export type UserAccountRole = Role;

export const AccountStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
  DELETED: 'DELETED',
} as const;
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
export type UserAccountStatus = AccountStatus;

export const OtpPurpose = {
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export const CatalogStatus = {
  ACTIVE: 'ACTIVE',
  DISCONTINUED: 'DISCONTINUED',
} as const;
export type CatalogStatus = (typeof CatalogStatus)[keyof typeof CatalogStatus];

export const ServicePackageStatus = {
  ON_SALE: 'ON_SALE',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type ServicePackageStatus = (typeof ServicePackageStatus)[keyof typeof ServicePackageStatus];

export const ServiceTier = {
  STANDARD: 'STANDARD',
  EXPRESS: 'EXPRESS',
} as const;
export type ServiceTier = (typeof ServiceTier)[keyof typeof ServiceTier];

export const SERVICE_TIER_LABELS: Record<ServiceTier, string> = {
  [ServiceTier.STANDARD]: 'Tiêu chuẩn (Standard)',
  [ServiceTier.EXPRESS]: 'Ưu tiên (Express)',
};

export const HandoverMethod = {
  SELF_DROP_OFF: 'SELF_DROP_OFF',
  PICKUP: 'PICKUP',
  PARCEL_SHIPPING: 'PARCEL_SHIPPING',
} as const;
export type HandoverMethod = (typeof HandoverMethod)[keyof typeof HandoverMethod];
export type FilmHandoverMethod = HandoverMethod;

export const HANDOVER_METHOD_LABELS: Record<HandoverMethod, string> = {
  [HandoverMethod.SELF_DROP_OFF]: 'Tự mang đến Lab',
  [HandoverMethod.PICKUP]: 'Shipper lấy phim nội thành',
  [HandoverMethod.PARCEL_SHIPPING]: 'Gửi bưu kiện liên tỉnh',
};

export const PaymentMethod = {
  ONLINE: 'ONLINE',
  PAY_AT_LAB: 'PAY_AT_LAB',
  COD: 'COD',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.ONLINE]: 'Thanh toán trực tuyến (VNPay)',
  [PaymentMethod.PAY_AT_LAB]: 'Thanh toán tại Lab',
  [PaymentMethod.COD]: 'Thanh toán khi nhận (COD)',
};

export const FilmRollStatus = {
  DECLARED: 'DECLARED',
  RECEIVED: 'RECEIVED',
  NOT_RECEIVED: 'NOT_RECEIVED',
  DAMAGED: 'DAMAGED',
} as const;
export type FilmRollStatus = (typeof FilmRollStatus)[keyof typeof FilmRollStatus];

export const FILM_ROLL_STATUS_LABELS: Record<FilmRollStatus, string> = {
  [FilmRollStatus.DECLARED]: 'Đã khai báo',
  [FilmRollStatus.RECEIVED]: 'Lab đã nhận cuộn phim',
  [FilmRollStatus.NOT_RECEIVED]: 'Chưa nhận được tại Lab',
  [FilmRollStatus.DAMAGED]: 'Phim bị hư hỏng vật lý',
};

export const ProcessingStage = {
  RECEIVED: 'RECEIVED',
  DEVELOPING: 'DEVELOPING',
  WASHING: 'WASHING',
  DRYING: 'DRYING',
  SCANNING: 'SCANNING',
  QC: 'QC',
} as const;
export type ProcessingStage = (typeof ProcessingStage)[keyof typeof ProcessingStage];

export const PROCESSING_STAGE_ORDER: readonly ProcessingStage[] = [
  ProcessingStage.RECEIVED,
  ProcessingStage.DEVELOPING,
  ProcessingStage.WASHING,
  ProcessingStage.DRYING,
  ProcessingStage.SCANNING,
  ProcessingStage.QC,
];

export const PROCESSING_STAGE_LABELS: Record<ProcessingStage, string> = {
  [ProcessingStage.RECEIVED]: 'Lab đã tiếp nhận phim',
  [ProcessingStage.DEVELOPING]: 'Đang tráng hóa chất',
  [ProcessingStage.WASHING]: 'Đang rửa ổn định phim',
  [ProcessingStage.DRYING]: 'Đang sấy khô âm bản',
  [ProcessingStage.SCANNING]: 'Đang scan kỹ thuật số',
  [ProcessingStage.QC]: 'Kiểm tra chất lượng (QC)',
};

export const ServiceOrderStatus = {
  AWAITING_PAYMENT: 'AWAITING_PAYMENT',
  AWAITING_LAB_CONFIRMATION: 'AWAITING_LAB_CONFIRMATION',
  AWAITING_FILM: 'AWAITING_FILM',
  AWAITING_MACHINE_ASSIGNMENT: 'AWAITING_MACHINE_ASSIGNMENT',
  IN_PROCESSING: 'IN_PROCESSING',
  AWAITING_TOP_UP: 'AWAITING_TOP_UP',
  READY_FOR_HANDOVER: 'READY_FOR_HANDOVER',
  DELIVERED: 'DELIVERED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type ServiceOrderStatus = (typeof ServiceOrderStatus)[keyof typeof ServiceOrderStatus];

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  [ServiceOrderStatus.AWAITING_PAYMENT]: 'Chờ thanh toán',
  [ServiceOrderStatus.AWAITING_LAB_CONFIRMATION]: 'Chờ Lab xác nhận',
  [ServiceOrderStatus.AWAITING_FILM]: 'Chờ bàn giao phim',
  [ServiceOrderStatus.AWAITING_MACHINE_ASSIGNMENT]: 'Chờ xếp lịch máy',
  [ServiceOrderStatus.IN_PROCESSING]: 'Đang xử lý tráng/scan',
  [ServiceOrderStatus.AWAITING_TOP_UP]: 'Chờ thanh toán bổ sung',
  [ServiceOrderStatus.READY_FOR_HANDOVER]: 'Sẵn sàng trả phim/file',
  [ServiceOrderStatus.DELIVERED]: 'Đã bàn giao',
  [ServiceOrderStatus.CLOSED]: 'Đã hoàn tất',
  [ServiceOrderStatus.CANCELLED]: 'Đã hủy',
  [ServiceOrderStatus.SUSPENDED]: 'Tạm hoãn xử lý',
};

export const ServiceOrderType = {
  DEVELOP_AND_SCAN: 'DEVELOP_AND_SCAN',
  AI_PREVIEW_PRINT: 'AI_PREVIEW_PRINT',
} as const;
export type ServiceOrderType = (typeof ServiceOrderType)[keyof typeof ServiceOrderType];

export const SERVICE_ORDER_TYPE_LABELS: Record<ServiceOrderType, string> = {
  [ServiceOrderType.DEVELOP_AND_SCAN]: 'Tráng & Scan phim',
  [ServiceOrderType.AI_PREVIEW_PRINT]: 'In ảnh từ Dương bản AI',
};

export const HandoverPoint = {
  COLLECTED_FROM_PHOTOGRAPHER: 'COLLECTED_FROM_PHOTOGRAPHER',
  HANDED_TO_PARTNER: 'HANDED_TO_PARTNER',
  RECEIVED_AT_LAB: 'RECEIVED_AT_LAB',
  HANDED_BACK_TO_PARTNER: 'HANDED_BACK_TO_PARTNER',
  RETURNED_TO_PHOTOGRAPHER: 'RETURNED_TO_PHOTOGRAPHER',
  COLLECTED_AT_LAB: 'COLLECTED_AT_LAB',
} as const;
export type HandoverPoint = (typeof HandoverPoint)[keyof typeof HandoverPoint];

export const HANDOVER_POINT_LABELS: Record<HandoverPoint, string> = {
  [HandoverPoint.COLLECTED_FROM_PHOTOGRAPHER]: 'Đã lấy phim từ nhiếp ảnh gia',
  [HandoverPoint.HANDED_TO_PARTNER]: 'Đã giao cho đối tác vận chuyển',
  [HandoverPoint.RECEIVED_AT_LAB]: 'Phòng Lab đã nhận phim',
  [HandoverPoint.HANDED_BACK_TO_PARTNER]: 'Lab đã bàn giao lại đối tác',
  [HandoverPoint.RETURNED_TO_PHOTOGRAPHER]: 'Đã trả phim cho nhiếp ảnh gia',
  [HandoverPoint.COLLECTED_AT_LAB]: 'Khách đã nhận lại phim tại Lab',
};

export const ScheduleChangeChoice = {
  WAIT: 'WAIT',
  CANCEL: 'CANCEL',
  TRANSFER: 'TRANSFER',
} as const;
export type ScheduleChangeChoice = (typeof ScheduleChangeChoice)[keyof typeof ScheduleChangeChoice];

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  REQUEST_NOT_SUPPORTED: 'REQUEST_NOT_SUPPORTED',
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONCURRENT_UPDATE_CONFLICT: 'CONCURRENT_UPDATE_CONFLICT',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ACCOUNT_INVALID_CREDENTIALS: 'ACCOUNT_INVALID_CREDENTIALS',
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_TEMPORARILY_LOCKED: 'ACCOUNT_TEMPORARILY_LOCKED',
  ACCOUNT_INVALID_TOKEN: 'ACCOUNT_INVALID_TOKEN',
  ACCOUNT_OTP_INVALID: 'ACCOUNT_OTP_INVALID',
  ACCOUNT_OTP_RESEND_TOO_FAST: 'ACCOUNT_OTP_RESEND_TOO_FAST',
  ACCOUNT_OTP_RESEND_LIMIT_EXCEEDED: 'ACCOUNT_OTP_RESEND_LIMIT_EXCEEDED',
  ACCOUNT_REGISTRATION_REJECTED: 'ACCOUNT_REGISTRATION_REJECTED',
  ACCOUNT_OLD_PASSWORD_INVALID: 'ACCOUNT_OLD_PASSWORD_INVALID',
  ACCOUNT_NEW_PASSWORD_SAME_AS_OLD: 'ACCOUNT_NEW_PASSWORD_SAME_AS_OLD',
  ACCOUNT_EMAIL_ALREADY_EXISTS: 'ACCOUNT_EMAIL_ALREADY_EXISTS',
  LAB_APPLICATION_DOCUMENT_COUNT_INVALID: 'LAB_APPLICATION_DOCUMENT_COUNT_INVALID',
  LAB_APPLICATION_CATALOG_NOT_ACTIVE: 'LAB_APPLICATION_CATALOG_NOT_ACTIVE',
  LAB_APPLICATION_NOT_FOUND: 'LAB_APPLICATION_NOT_FOUND',
  LAB_APPLICATION_ALREADY_REVIEWED: 'LAB_APPLICATION_ALREADY_REVIEWED',
  LAB_APPLICATION_CONFLICT: 'LAB_APPLICATION_CONFLICT',
  LAB_NOT_FOUND: 'LAB_NOT_FOUND',
  LAB_ACCESS_DENIED: 'LAB_ACCESS_DENIED',
  LAB_IMAGE_LIMIT_REACHED: 'LAB_IMAGE_LIMIT_REACHED',
  LAB_IMAGE_NOT_FOUND: 'LAB_IMAGE_NOT_FOUND',
  LAB_MACHINES_NOT_READY: 'LAB_MACHINES_NOT_READY',
  LAB_PACKAGE_NOT_FOUND: 'LAB_PACKAGE_NOT_FOUND',
  LAB_PACKAGE_NAME_DUPLICATE: 'LAB_PACKAGE_NAME_DUPLICATE',
  LAB_PACKAGE_MASTERDATA_INACTIVE: 'LAB_PACKAGE_MASTERDATA_INACTIVE',
  LAB_SCAN_OPTION_IN_USE: 'LAB_SCAN_OPTION_IN_USE',
  MACHINE_NOT_FOUND: 'MACHINE_NOT_FOUND',
  MACHINE_CODE_DUPLICATE: 'MACHINE_CODE_DUPLICATE',
  MACHINE_MASTERDATA_INACTIVE: 'MACHINE_MASTERDATA_INACTIVE',
  MACHINE_INCIDENT_NOT_FOUND: 'MACHINE_INCIDENT_NOT_FOUND',
  MACHINE_INCIDENT_ALREADY_RESOLVED: 'MACHINE_INCIDENT_ALREADY_RESOLVED',
  ORDER_LAB_NOT_ACCEPTING: 'ORDER_LAB_NOT_ACCEPTING',
  ORDER_PACKAGE_NOT_ORDERABLE: 'ORDER_PACKAGE_NOT_ORDERABLE',
  ORDER_FILM_FORMAT_MISMATCH: 'ORDER_FILM_FORMAT_MISMATCH',
  ORDER_SCAN_OPTION_INVALID: 'ORDER_SCAN_OPTION_INVALID',
  ORDER_PUSH_PULL_NOT_AVAILABLE: 'ORDER_PUSH_PULL_NOT_AVAILABLE',
  ORDER_FILM_STOCK_INVALID: 'ORDER_FILM_STOCK_INVALID',
  ORDER_OPTION_NOT_SUPPORTED: 'ORDER_OPTION_NOT_SUPPORTED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_STATUS_CONFLICT: 'ORDER_STATUS_CONFLICT',
  ORDER_SCHEDULE_INFEASIBLE: 'ORDER_SCHEDULE_INFEASIBLE',
  ORDER_PROMISED_DATE_TOO_EARLY: 'ORDER_PROMISED_DATE_TOO_EARLY',
  ORDER_STAGE_OUT_OF_ORDER: 'ORDER_STAGE_OUT_OF_ORDER',
  ORDER_ROLL_NOT_FOUND: 'ORDER_ROLL_NOT_FOUND',
  ARCHIVE_LINK_UNREACHABLE: 'ARCHIVE_LINK_UNREACHABLE',
  ARCHIVE_DELIVERY_INCOMPLETE: 'ARCHIVE_DELIVERY_INCOMPLETE',
  ARCHIVE_PREVIEW_INVALID: 'ARCHIVE_PREVIEW_INVALID',
  ARCHIVE_PREVIEW_LIMIT_REACHED: 'ARCHIVE_PREVIEW_LIMIT_REACHED',
  ARCHIVE_ROLL_NOT_FOUND: 'ARCHIVE_ROLL_NOT_FOUND',
  PAYMENT_GATEWAY_NOT_CONFIGURED: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
  STORAGE_FILE_TYPE_NOT_ALLOWED: 'STORAGE_FILE_TYPE_NOT_ALLOWED',
  STORAGE_FILE_TOO_LARGE: 'STORAGE_FILE_TOO_LARGE',
  STORAGE_LINK_INVALID: 'STORAGE_LINK_INVALID',
  STORAGE_UNAVAILABLE: 'STORAGE_UNAVAILABLE',
  MASTERDATA_CODE_DUPLICATE: 'MASTERDATA_CODE_DUPLICATE',
  MASTERDATA_IN_USE: 'MASTERDATA_IN_USE',
  SYSTEM_PARAMETER_NOT_FOUND: 'SYSTEM_PARAMETER_NOT_FOUND',
  SYSTEM_PARAMETER_INVALID_VALUE: 'SYSTEM_PARAMETER_INVALID_VALUE',
  SYSTEM_PARAMETER_CONFLICT: 'SYSTEM_PARAMETER_CONFLICT',
  SYSTEM_PARAMETER_READ_ONLY: 'SYSTEM_PARAMETER_READ_ONLY',
  AI_PROVIDER_UNAVAILABLE: 'AI_PROVIDER_UNAVAILABLE',
  AI_CHAT_SESSION_NOT_FOUND: 'AI_CHAT_SESSION_NOT_FOUND',
  AI_NEGATIVE_INVALID_IMAGE: 'AI_NEGATIVE_INVALID_IMAGE',
  AI_PREVIEW_SESSION_NOT_FOUND: 'AI_PREVIEW_SESSION_NOT_FOUND',
  AI_PREVIEW_SESSION_EXPIRED: 'AI_PREVIEW_SESSION_EXPIRED',
  AI_PREVIEW_REGENERATION_LIMIT_REACHED: 'AI_PREVIEW_REGENERATION_LIMIT_REACHED',
  AI_PREVIEW_DOWNLOAD_LOCKED: 'AI_PREVIEW_DOWNLOAD_LOCKED',
  AI_PREVIEW_FREE_QUOTA_EXCEEDED: 'AI_PREVIEW_FREE_QUOTA_EXCEEDED',
  PRINT_SIZE_NOT_SUPPORTED_BY_LAB: 'PRINT_SIZE_NOT_SUPPORTED_BY_LAB',
  SCAN_FILE_NOT_FOUND: 'SCAN_FILE_NOT_FOUND',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const FilmProcess = {
  C41: 'C-41',
  BW: 'B&W',
  E6: 'E-6',
  ECN2: 'ECN-2',
} as const;
export type FilmProcess = (typeof FilmProcess)[keyof typeof FilmProcess];

export const FilmFormat = {
  FORMAT_35MM: '135 (35mm)',
  FORMAT_120: '120 (Medium Format)',
  FORMAT_LARGE: 'Large Format (4x5)',
} as const;
export type FilmFormat = (typeof FilmFormat)[keyof typeof FilmFormat];

export const ExpertApplicationStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ExpertApplicationStatus =
  (typeof ExpertApplicationStatus)[keyof typeof ExpertApplicationStatus];

export const ArticleStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  KB_PENDING: 'KB_PENDING',
  KB_APPROVED: 'KB_APPROVED',
} as const;
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];
