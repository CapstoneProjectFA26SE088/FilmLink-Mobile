import { MIN_CONSIGNMENT_PRICE_VND } from './constants';

export function validateConsignmentOfferPrice(
  priceText: string,
  currentPrice: number,
): { readonly valid: boolean; readonly numericPrice?: number; readonly error?: string | null } {
  const sanitized = priceText.replace(/[^0-9]/g, '');
  const numericPrice = Number(sanitized);
  if (!sanitized || Number.isNaN(numericPrice)) {
    return { valid: false, error: 'Giá đề xuất không hợp lệ.' };
  }
  const minAllowed = currentPrice * 0.6;
  const maxAllowed = currentPrice;
  if (numericPrice < minAllowed || numericPrice > maxAllowed) {
    return {
      valid: false,
      error: `Giá trả phải từ 60% đến 100% giá gốc (${minAllowed.toLocaleString('vi-VN')} ₫ – ${maxAllowed.toLocaleString('vi-VN')} ₫).`,
    };
  }
  return { valid: true, numericPrice, error: null };
}

export function validateConsignmentListingInput(input: {
  readonly title: string;
  readonly priceText: string;
}): { readonly valid: boolean; readonly numericPrice?: number; readonly error?: string | null } {
  if (!input.title.trim()) {
    return { valid: false, error: 'Vui lòng nhập tên thiết bị ký gửi.' };
  }
  const sanitized = input.priceText.replace(/[^0-9]/g, '');
  const numericPrice = Number(sanitized);
  if (!sanitized || Number.isNaN(numericPrice) || numericPrice < MIN_CONSIGNMENT_PRICE_VND) {
    return {
      valid: false,
      error: `Giá ký gửi tối thiểu là ${MIN_CONSIGNMENT_PRICE_VND.toLocaleString('vi-VN')} ₫.`,
    };
  }
  return { valid: true, numericPrice, error: null };
}
