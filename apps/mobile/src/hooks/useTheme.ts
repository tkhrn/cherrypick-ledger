import { useColorScheme } from 'react-native';
import { CATEGORY_COLORS, COLORS, STATUS_TONE, type ColorScheme } from '@/constants/theme';

export function useTheme() {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: COLORS[scheme], status: STATUS_TONE[scheme], categories: CATEGORY_COLORS[scheme] };
}

export type Theme = ReturnType<typeof useTheme>;
