export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

export function formatVnd(amount: number | undefined | null): string {
  if (amount == null || Number.isNaN(amount)) {
    return '0 ₫';
  }
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

function parseDateInput(isoOrDate: string | Date | undefined | null): Date | null {
  if (!isoOrDate) {
    return null;
  }
  if (typeof isoOrDate === 'string' && !isoOrDate.trim()) {
    return null;
  }
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate.trim()) : isoOrDate;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateVn(isoOrDate: string | Date | undefined | null): string {
  if (!isoOrDate || (typeof isoOrDate === 'string' && !isoOrDate.trim())) {
    return '';
  }
  const date = parseDateInput(isoOrDate);
  if (!date) {
    return String(isoOrDate);
  }
  try {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: VIETNAM_TIMEZONE,
    });
  } catch {
    return String(isoOrDate);
  }
}

export function formatDateTimeVn(isoOrDate: string | Date | undefined | null): string {
  if (!isoOrDate || (typeof isoOrDate === 'string' && !isoOrDate.trim())) {
    return '';
  }
  const date = parseDateInput(isoOrDate);
  if (!date) {
    return String(isoOrDate);
  }
  try {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: VIETNAM_TIMEZONE,
    });
  } catch {
    return String(isoOrDate);
  }
}
