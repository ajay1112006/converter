import { PresentationTheme } from '../types';

export const THEMES: Record<string, PresentationTheme> = {
  indigo: {
    id: 'indigo',
    name: 'Modern Indigo',
    primaryColor: '4F46E5',
    secondaryColor: '4338CA',
    accentColor: 'EEF2FF',
    textColor: '0F172A',
    lightBgColor: 'F8FAFC',
    headerBgColor: '4F46E5',
    headerTextColor: 'FFFFFF',
    fontFace: 'Arial',
  },
  slate: {
    id: 'slate',
    name: 'Executive Slate',
    primaryColor: '1E293B',
    secondaryColor: '334155',
    accentColor: 'F1F5F9',
    textColor: '0F172A',
    lightBgColor: 'F8FAFC',
    headerBgColor: '1E293B',
    headerTextColor: 'FFFFFF',
    fontFace: 'Calibri',
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Growth',
    primaryColor: '059669',
    secondaryColor: '047857',
    accentColor: 'ECFDF5',
    textColor: '064E3B',
    lightBgColor: 'F9FAFB',
    headerBgColor: '059669',
    headerTextColor: 'FFFFFF',
    fontFace: 'Arial',
  },
  navy: {
    id: 'navy',
    name: 'Royal Navy',
    primaryColor: '1E3A8A',
    secondaryColor: '1D4ED8',
    accentColor: 'EFF6FF',
    textColor: '172554',
    lightBgColor: 'F8FAFC',
    headerBgColor: '1E3A8A',
    headerTextColor: 'FFFFFF',
    fontFace: 'Calibri',
  },
  crimson: {
    id: 'crimson',
    name: 'Vibrant Crimson',
    primaryColor: 'E11D48',
    secondaryColor: 'BE123C',
    accentColor: 'FFF1F2',
    textColor: '1C1917',
    lightBgColor: 'FAFAF9',
    headerBgColor: 'E11D48',
    headerTextColor: 'FFFFFF',
    fontFace: 'Arial',
  },
};

export function getTheme(themeId?: string): PresentationTheme {
  if (themeId && THEMES[themeId]) {
    return THEMES[themeId];
  }
  return THEMES.indigo;
}
