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
  brand: '#0169CC',
  brandIcon: '#0285FF',
  brandHover: '#004F99',
  brandSoft: '#E5F3FF',
  brandForeground: '#FFFFFF',
  focusRing: '#0285FF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#F9F9F9',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F3F3F3',
  textPrimary: '#0D0D0D',
  textSecondary: '#5D5D5D',
  textMuted: '#767676',
  border: '#E5E5E5',
  borderStrong: '#CDCDCD',
  status: {
    successBg: '#EDFAF2',
    successText: '#00692A',
    warningBg: '#FFF6D9',
    warningText: '#6E5400',
    errorBg: '#FFF0F0',
    errorText: '#911E1B',
    infoBg: '#E5F3FF',
    infoText: '#003F7A',
  },
};

export const darkPalette: ThemePalette = {
  brand: '#339CFF',
  brandIcon: '#339CFF',
  brandHover: '#66B5FF',
  brandSoft: '#102A40',
  brandForeground: '#0D0D0D',
  focusRing: '#66B5FF',
  background: '#0D0D0D',
  surface: '#181818',
  surfaceMuted: '#212121',
  surfaceElevated: '#242424',
  surfaceHover: '#282828',
  textPrimary: '#FFFFFF',
  textSecondary: '#CDCDCD',
  textMuted: '#9F9F9F',
  border: '#414141',
  borderStrong: '#5D5D5D',
  status: {
    successBg: '#003716',
    successText: '#8CDFAD',
    warningBg: '#4D3B00',
    warningText: '#FFDB66',
    errorBg: '#4D100E',
    errorText: '#FFA4A2',
    infoBg: '#00284D',
    infoText: '#99CEFF',
  },
};

export const colors = {
  transparent: 'transparent',
  primary: { DEFAULT: '#0169CC', pressed: '#004F99', foreground: '#FFFFFF' },
  danger: { DEFAULT: '#911E1B', pressed: '#6E1412', foreground: '#FFFFFF' },
  surface: { DEFAULT: '#FFFFFF', muted: '#F9F9F9', pressed: '#F3F3F3' },
  content: { DEFAULT: '#0D0D0D', muted: '#5D5D5D', inverse: '#FFFFFF' },
  border: { DEFAULT: '#E5E5E5' },
} as const;

export const radius = {
  none: '0px',
  sm: '6px',
  DEFAULT: '10px',
  lg: '16px',
  full: '9999px',
} as const;
