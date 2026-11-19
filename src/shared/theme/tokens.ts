export type ThemePalette = {
  readonly brand: string;
  readonly brandIcon: string;
  readonly brandHover: string;
  readonly brandSoft: string;
  readonly brandForeground: string;
  readonly focusRing: string;
  readonly background: string;
  readonly surface: string;
  readonly surfaceMuted: string;
  readonly surfaceElevated: string;
  readonly surfaceHover: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly status: {
    readonly successBg: string;
    readonly successText: string;
    readonly warningBg: string;
    readonly warningText: string;
    readonly errorBg: string;
    readonly errorText: string;
    readonly infoBg: string;
    readonly infoText: string;
  };
};

export const lightPalette: ThemePalette = {
  brand: '#D97706',
  brandIcon: '#F59E0B',
  brandHover: '#B45309',
  brandSoft: '#FEF3C7',
  brandForeground: '#FFFFFF',
  focusRing: '#F59E0B',
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EFEA',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#EFE9E1',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  status: {
    successBg: '#ECFDF5',
    successText: '#047857',
    warningBg: '#FFFBEB',
    warningText: '#B45309',
    errorBg: '#FEF2F2',
    errorText: '#B91C1C',
    infoBg: '#EFF6FF',
    infoText: '#1D4ED8',
  },
};

export const darkPalette: ThemePalette = {
  brand: '#F59E0B',
  brandIcon: '#FBBF24',
  brandHover: '#D97706',
  brandSoft: '#291E0A',
  brandForeground: '#1C1917',
  focusRing: '#FBBF24',
  background: '#121110',
  surface: '#1C1A18',
  surfaceMuted: '#242220',
  surfaceElevated: '#2A2724',
  surfaceHover: '#322E2A',
  textPrimary: '#F5F5F4',
  textSecondary: '#A8A29E',
  textMuted: '#78716C',
  border: '#383533',
  borderStrong: '#57534E',
  status: {
    successBg: '#064E3B',
    successText: '#6EE7B7',
    warningBg: '#78350F',
    warningText: '#FCD34D',
    errorBg: '#7F1D1D',
    errorText: '#FCA5A5',
    infoBg: '#1E3A8A',
    infoText: '#93C5FD',
  },
};

export const colors = {
  transparent: 'transparent',
  primary: { DEFAULT: '#D97706', pressed: '#B45309', foreground: '#FFFFFF' },
  danger: { DEFAULT: '#B91C1C', pressed: '#991B1B', foreground: '#FFFFFF' },
  surface: { DEFAULT: '#FFFFFF', muted: '#F3EFEA', pressed: '#EFE9E1' },
  content: { DEFAULT: '#1C1917', muted: '#78716C', inverse: '#FFFFFF' },
  border: { DEFAULT: '#E7E5E4' },
} as const;

export const radius = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  DEFAULT: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;
