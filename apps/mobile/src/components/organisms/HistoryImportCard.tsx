import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { Chip } from '@/components/atoms/Chip';
import { FONT, RADIUS, SPACE } from '@/constants/theme';
import { DEFAULT_IMPORT_DAYS, useHistoryImport, type HistoryImportResult } from '@/hooks/useHistoryImport';
import { useTheme } from '@/hooks/useTheme';

const PERIOD_OPTIONS = [7, 30, 90] as const;

function resultMessage(r: HistoryImportResult): string {
  const total = r.sms + r.notifications;
  if (total === 0) return r.smsDenied ? '문자 읽기 권한이 없어 가져오지 못했어요.' : '가져올 결제 문자가 없어요.';
  return `문자 ${r.sms}건, 알림 ${r.notifications}건을 가져왔어요. 업로드가 끝나면 정리 탭에서 "지금 정리하기"를 눌러 주세요.`;
}

/** 설정 전에 받은 결제 문자를 기간을 골라 가져온다 */
export function HistoryImportCard({ framed = true }: { framed?: boolean }) {
  const { colors, status } = useTheme();
  const { run, isRunning, result, error } = useHistoryImport();
  const [days, setDays] = useState<number>(DEFAULT_IMPORT_DAYS);

  return (
    <View style={[styles.card, framed && { backgroundColor: colors.bgSurface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[FONT.body, styles.title, { color: colors.textPrimary }]}>지난 결제 문자 가져오기</Text>
      <Text style={[FONT.caption, { color: colors.textSecondary }]}>설치 전에 받은 카드·은행 문자를 가져와요. 지운 앱 알림은 가져올 수 없어요.</Text>
      <View style={styles.chips}>
        {PERIOD_OPTIONS.map((option) => (
          <Chip key={option} label={`최근 ${option}일`} selected={days === option} tone={status.group} onPress={() => setDays(option)} />
        ))}
      </View>
      <Button label="가져오기" isLoading={isRunning} onPress={() => run(days)} />
      {result ? <Text style={[FONT.caption, { color: colors.textSecondary }]}>{resultMessage(result)}</Text> : null}
      {error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>가져오지 못했어요. 다시 시도해 주세요.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACE.sm, padding: SPACE.lg, borderRadius: RADIUS.md, alignSelf: 'stretch' },
  title: { fontWeight: '600' },
  chips: { flexDirection: 'row', gap: SPACE.sm },
});
