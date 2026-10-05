import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { TextField } from '@/components/atoms/TextField';
import { FONT, ROW_HEIGHT, SPACE } from '@/constants/theme';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';

export default function SetupGroupsPage() {
  const { colors } = useTheme();
  const { groups, add, update } = useGroups();
  const [name, setName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    add.mutate(name.trim(), { onSuccess: () => setName('') });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bgPage }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {groups.length === 0 ? <Text style={[FONT.caption, styles.empty, { color: colors.textSecondary }]}>아직 모임이 없어요. 아래에서 추가하거나 정리할 때 만들 수 있어요.</Text> : null}
      {groups.map((g) => (
        <View key={g.id} style={[styles.row, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border, opacity: g.archived ? 0.5 : 1 }]}>
          <Text style={[FONT.body, styles.grow, { color: colors.textPrimary }]}>{g.name}</Text>
          <Pressable onPress={() => update.mutate({ id: g.id, archived: !g.archived })} hitSlop={SPACE.sm}>
            <Text style={[FONT.caption, { color: colors.accent }]}>{g.archived ? '복원' : '보관'}</Text>
          </Pressable>
        </View>
      ))}
      <View style={styles.form}>
        <TextField label="새 모임" placeholder="풋살 모임" value={name} onChangeText={setName} onSubmitEditing={handleAdd} />
        <Button label="모임 추가" onPress={handleAdd} isLoading={add.isPending} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: SPACE.lg },
  empty: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.md },
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  grow: { flex: 1 },
  form: { padding: SPACE.lg, gap: SPACE.md },
});
