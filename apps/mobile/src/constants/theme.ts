import { StyleSheet } from 'react-native';

// designs/look-and-feel.md 토큰을 그대로 옮긴 값. 색은 여기서만 정의한다.

const base = {
  light: {
    bgPage: '#F7F7F5', bgSurface: '#FFFFFF', bgSubtle: '#F1EFE8',
    textPrimary: '#1F1E1D', textSecondary: '#5F5E5A', textMuted: '#888780',
    border: '#E4E2DA', accent: '#185FA5', accentTint: '#E6F1FB', onAccent: '#FFFFFF',
  },
  dark: {
    bgPage: '#141413', bgSurface: '#1F1F1D', bgSubtle: '#2A2A28',
    textPrimary: '#F1EFE8', textSecondary: '#B4B2A9', textMuted: '#888780',
    border: '#353533', accent: '#85B7EB', accentTint: '#0C447C', onAccent: '#042C53',
  },
} as const;

export const STATUS_TONE = {
  light: {
    mine: { bg: '#EAF3DE', fg: '#3B6D11' },
    group: { bg: '#E6F1FB', fg: '#185FA5' },
    review: { bg: '#FAEEDA', fg: '#854F0B' },
    ignored: { bg: '#F1EFE8', fg: '#5F5E5A' },
    cancelled: { bg: '#FCEBEB', fg: '#A32D2D' },
  },
  dark: {
    mine: { bg: '#27500A', fg: '#C0DD97' },
    group: { bg: '#0C447C', fg: '#B5D4F4' },
    review: { bg: '#633806', fg: '#FAC775' },
    ignored: { bg: '#444441', fg: '#D3D1C7' },
    cancelled: { bg: '#791F1F', fg: '#F7C1C1' },
  },
} as const;

export const CATEGORY_COLORS = {
  light: {
    'cat-coral': { bg: '#FAECE7', fg: '#993C1D', bar: '#D85A30' },
    'cat-amber': { bg: '#FAEEDA', fg: '#854F0B', bar: '#EF9F27' },
    'cat-teal': { bg: '#E1F5EE', fg: '#0F6E56', bar: '#1D9E75' },
    'cat-pink': { bg: '#FBEAF0', fg: '#993556', bar: '#D4537E' },
    'cat-purple': { bg: '#EEEDFE', fg: '#534AB7', bar: '#7F77DD' },
    'cat-red': { bg: '#FCEBEB', fg: '#A32D2D', bar: '#E24B4A' },
    'cat-blue': { bg: '#E6F1FB', fg: '#185FA5', bar: '#378ADD' },
    'cat-green': { bg: '#EAF3DE', fg: '#3B6D11', bar: '#639922' },
    'cat-gray': { bg: '#F1EFE8', fg: '#5F5E5A', bar: '#888780' },
  },
  dark: {
    'cat-coral': { bg: '#712B13', fg: '#F5C4B3', bar: '#F0997B' },
    'cat-amber': { bg: '#633806', fg: '#FAC775', bar: '#EF9F27' },
    'cat-teal': { bg: '#085041', fg: '#9FE1CB', bar: '#5DCAA5' },
    'cat-pink': { bg: '#72243E', fg: '#F4C0D1', bar: '#ED93B1' },
    'cat-purple': { bg: '#3C3489', fg: '#CECBF6', bar: '#AFA9EC' },
    'cat-red': { bg: '#791F1F', fg: '#F7C1C1', bar: '#F09595' },
    'cat-blue': { bg: '#0C447C', fg: '#B5D4F4', bar: '#85B7EB' },
    'cat-green': { bg: '#27500A', fg: '#C0DD97', bar: '#97C459' },
    'cat-gray': { bg: '#444441', fg: '#D3D1C7', bar: '#B4B2A9' },
  },
} as const;

export type ColorScheme = keyof typeof base;
export type CategoryColorToken = keyof (typeof CATEGORY_COLORS)['light'];
export type StatusTone = keyof (typeof STATUS_TONE)['light'];
export const CATEGORY_COLOR_TOKENS = Object.keys(CATEGORY_COLORS.light) as CategoryColorToken[];

/** 브랜드 색. 아이콘·스플래시·로그인 화면에만 쓴다 (앱 안은 조용한 기본 색 유지) */
export const BRAND = { cherry: '#C8364B', cherryPressed: '#A82B3E', leaf: '#2F5D3A', cream: '#FBF3EC', onCherry: '#FFFFFF' } as const;

export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const RADIUS = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const ROW_HEIGHT = 56;
export const ICON_CIRCLE = 32;

export const FONT = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '600' },
  amountLarge: { fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  body: { fontSize: 15, fontWeight: '400' },
  amount: { fontSize: 15, fontWeight: '500', fontVariant: ['tabular-nums'] },
  caption: { fontSize: 12, fontWeight: '400' },
  micro: { fontSize: 10, fontWeight: '400', fontVariant: ['tabular-nums'] },
  mono: { fontSize: 12, fontFamily: 'monospace' },
});

export const COLORS = base;
