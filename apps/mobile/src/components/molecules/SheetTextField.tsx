import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type SheetTextFieldProps = ComponentProps<typeof BottomSheetTextInput> & { label?: string };

/** 바텀시트 안 입력칸. 키보드가 올라오면 시트가 같이 올라간다 */
export function SheetTextField({ label, style, ...rest }: SheetTextFieldProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[FONT.caption, { color: colors.textSecondary }]}>{label}</Text> : null}
      <BottomSheetTextInput
        placeholderTextColor={colors.textMuted}
        style={[FONT.body, styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.bgSurface }, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.xs },
  input: { minHeight: 44, borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE.md },
});
