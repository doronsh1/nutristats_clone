export type ThemeColors = {
  background: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  muted: string;
  accent: string;
  accentSecondary: string;
  accentSoft: string;
  premium: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
};

const kineticBase = {
  background: '#0E0E0E',
  surface: '#131313',
  surfaceMuted: '#1A1A1A',
  text: '#FFFFFF',
  muted: '#ADAAAA',
  accent: '#FF8F6F',
  accentSecondary: '#00E3FD',
  accentSoft: '#271915',
  premium: '#C2FF99',
  border: '#2C2C2C',
  success: '#75FD00',
  danger: '#FF716C',
  warning: '#FFB067',
} satisfies ThemeColors;

export const lightColors: ThemeColors = {
  ...kineticBase,
  surface: '#171717',
  surfaceMuted: '#1F1F1F',
  border: '#353535',
};

export const darkColors: ThemeColors = {
  ...kineticBase,
};
