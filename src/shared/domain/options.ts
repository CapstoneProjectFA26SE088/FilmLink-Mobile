import {
  FilmFormat,
  FilmProcess,
  HANDOVER_METHOD_LABELS,
  HandoverMethod,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  SERVICE_TIER_LABELS,
  ServiceTier,
} from './enums';
import type { ConsignmentCategory } from './types';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_OFFER_ROUNDS = 3;
export const OTP_LENGTH = 6;
export const OTP_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export const PROCESS_FILTERS: readonly {
  readonly value: FilmProcess | 'ALL';
  readonly label: string;
}[] = [
  { value: 'ALL', label: 'Tất cả quy trình' },
  { value: FilmProcess.C41, label: 'Màu C-41' },
  { value: FilmProcess.BW, label: 'Đen trắng B&W' },
  { value: FilmProcess.E6, label: 'Slide E-6' },
  { value: FilmProcess.ECN2, label: 'Điện ảnh ECN-2' },
];

export const FORMAT_FILTERS: readonly {
  readonly value: FilmFormat | 'ALL';
  readonly label: string;
}[] = [
  { value: 'ALL', label: 'Mọi khổ phim' },
  { value: FilmFormat.FORMAT_35MM, label: '135 (35mm)' },
  { value: FilmFormat.FORMAT_120, label: '120 Medium' },
  { value: FilmFormat.FORMAT_LARGE, label: 'Large 4x5' },
];

export const POPULAR_FILM_STOCKS: readonly string[] = [
  'Kodak Portra 400',
  'Kodak Gold 200',
  'Ilford HP5 Plus 400',
  'CineStill 800T',
  'Kodak Vision3 500T',
  'Fujifilm Provia 100F',
];

export const HANDOVER_OPTIONS: readonly {
  readonly value: HandoverMethod;
  readonly label: string;
}[] = [
  {
    value: HandoverMethod.SELF_DROP_OFF,
    label: HANDOVER_METHOD_LABELS[HandoverMethod.SELF_DROP_OFF],
  },
  {
    value: HandoverMethod.PICKUP,
    label: HANDOVER_METHOD_LABELS[HandoverMethod.PICKUP],
  },
  {
    value: HandoverMethod.PARCEL_SHIPPING,
    label: HANDOVER_METHOD_LABELS[HandoverMethod.PARCEL_SHIPPING],
  },
];

export const PAYMENT_METHOD_OPTIONS: readonly {
  readonly value: PaymentMethod;
  readonly label: string;
}[] = [
  {
    value: PaymentMethod.ONLINE,
    label: PAYMENT_METHOD_LABELS[PaymentMethod.ONLINE],
  },
  {
    value: PaymentMethod.PAY_AT_LAB,
    label: PAYMENT_METHOD_LABELS[PaymentMethod.PAY_AT_LAB],
  },
  {
    value: PaymentMethod.COD,
    label: PAYMENT_METHOD_LABELS[PaymentMethod.COD],
  },
];

export const SERVICE_TIER_OPTIONS: readonly {
  readonly value: ServiceTier;
  readonly label: string;
}[] = [
  {
    value: ServiceTier.STANDARD,
    label: SERVICE_TIER_LABELS[ServiceTier.STANDARD],
  },
  {
    value: ServiceTier.EXPRESS,
    label: SERVICE_TIER_LABELS[ServiceTier.EXPRESS],
  },
];

export const CATEGORY_OPTIONS: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'Tất cả', label: 'Tất cả' },
  { value: 'Máy ảnh cơ', label: 'Máy ảnh cơ' },
  { value: 'Ống kính', label: 'Ống kính' },
  { value: 'Phim cuộn', label: 'Phim cuộn' },
  { value: 'Phụ kiện buồng tối', label: 'Phụ kiện buồng tối' },
];

export const CONSIGNMENT_CATEGORIES: readonly ConsignmentCategory[] = [
  'Máy ảnh cơ',
  'Ống kính',
  'Phim cuộn',
  'Phụ kiện buồng tối',
];

export const HOLDING_LABS: readonly string[] = [
  'Mộc Film Lab',
  'Darkroom Sài Gòn',
  'LLab Analog Hà Nội',
];

export const ARTICLE_CATEGORIES: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'Kỹ thuật buồng tối', label: 'Kỹ thuật buồng tối' },
  { value: 'Hóa chất & Quy trình', label: 'Hóa chất & Quy trình' },
  { value: 'Thiết bị & Bảo dưỡng', label: 'Thiết bị & Bảo dưỡng' },
];

export const EXPERT_SPECIALIZATIONS: readonly { readonly value: string; readonly label: string }[] =
  [
    { value: 'Buồng tối Đen Trắng (B&W)', label: 'Buồng tối Đen Trắng (B&W)' },
    { value: 'Hóa chất Màu C-41 & ECN-2', label: 'Hóa chất Màu C-41 & ECN-2' },
    { value: 'Bảo dưỡng Máy ảnh cơ học', label: 'Bảo dưỡng Máy ảnh cơ học' },
    { value: 'Nhiếp ảnh Khổ lớn (Medium/Large Format)', label: 'Medium / Large Format' },
  ];

export const SUGGESTED_PROMPTS: readonly string[] = [
  'Nên push Ilford HP5+ lên ISO 1600 bằng thuốc nào?',
  'Phim điện ảnh Kodak Vision3 500T tráng ECN-2 ở đâu?',
  'Cách phân biệt vệt lộ sáng nắp lưng và lỗi màn trập?',
];
