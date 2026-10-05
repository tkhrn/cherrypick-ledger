import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  errorText?: string | null;
}

export function TextField({ label, errorText, style, ...rest }: TextFieldProps) {
  const { colors, status } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[FONT.caption, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[FONT.body, styles.input, { color: colors.textPrimary, borderColor: errorText ? status.cancelled.fg : colors.border, backgroundColor: colors.bgSurface }, style]}
        {...rest}
      />
      {errorText ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.xs },
  input: { minHeight: 44, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md },
});
