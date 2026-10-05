import { IconTrash } from '@tabler/icons-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { FONT, ROW_HEIGHT, SPACE } from '@/constants/theme';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useTheme } from '@/hooks/useTheme';

const LAST4_PATTERN = /^\d{4}$/;

export function MyAccountsEditor() {
  const { colors, status } = useTheme();
  const { accounts, add, remove } = useMyAccounts();
  const [bankName, setBankName] = useState('');
  const [last4, setLast4] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!bankName.trim() || !LAST4_PATTERN.test(last4)) {
      setError('은행 이름과 계좌번호 끝 4자리를 입력해 주세요');
      return;
    }
    setError(null);
    add.mutate({ bankName: bankName.trim(), last4 }, { onSuccess: () => { setBankName(''); setLast4(''); } });
  };

  return (
    <View style={styles.wrap}>
      {accounts.map((account) => (
        <View key={account.id} style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[FONT.body, styles.grow, { color: colors.textPrimary }]}>{`${account.bank_name} ····${account.last4}`}</Text>
          <Pressable accessibilityLabel={`${account.bank_name} 계좌 삭제`} onPress={() => remove.mutate(account.id)} hitSlop={SPACE.sm}>
            <IconTrash size={18} color={colors.textMuted} />
          </Pressable>
        </View>
      ))}
      <View style={styles.form}>
        <View style={styles.inputs}>
          <View style={styles.grow}>
            <TextField placeholder="신한은행" value={bankName} onChangeText={setBankName} />
          </View>
          <View style={styles.last4}>
            <TextField placeholder="끝 4자리" keyboardType="number-pad" maxLength={4} value={last4} onChangeText={setLast4} />
          </View>
        </View>
        {error ? <Text style={[FONT.caption, { color: status.cancelled.fg }]}>{error}</Text> : null}
        <Button label="계좌 추가" isLoading={add.isPending} onPress={handleAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg },
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  grow: { flex: 1 },
  form: { paddingTop: SPACE.lg, gap: SPACE.sm },
  inputs: { flexDirection: 'row', gap: SPACE.sm },
  last4: { width: 110 },
});
