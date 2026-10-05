import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { BRAND, FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'brand';
  isLoading?: boolean;
}

export function Button({ label, variant = 'secondary', isLoading = false, disabled, style, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isBrand = variant === 'brand';
  const textColor = isBrand ? BRAND.onCherry : isPrimary ? colors.onAccent : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        isPrimary && { backgroundColor: colors.accent },
        isBrand && { backgroundColor: state.pressed ? BRAND.cherryPressed : BRAND.cherry },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      disabled={disabled}
      accessibilityState={{ disabled: Boolean(disabled) }}
      {...rest}
    >
      {isLoading ? <ActivityIndicator color={textColor} /> : <Text style={[FONT.body, styles.label, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 44, borderRadius: RADIUS.md, paddingHorizontal: SPACE.lg, alignItems: 'center', justifyContent: 'center' },
  label: { fontWeight: '600' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});
