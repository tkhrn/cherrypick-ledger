import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/atoms/Chip';
import { TextField } from '@/components/atoms/TextField';
import { DecisionPicker } from '@/components/molecules/DecisionPicker';
import { FONT, SPACE } from '@/constants/theme';
import { useCategories } from '@/hooks/useCategories';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionDecision } from '@/hooks/useTransactionDecision';
import type { DecisionStatus, Transaction } from '@/types/transaction';

/** 세 갈래 결정 + 카테고리·모임 선택. 누르는 즉시 저장한다 */
export function DecisionSection({ transaction }: { transaction: Transaction }) {
  const { colors, categories: categoryTones, status } = useTheme();
  const { activeCategories } = useCategories();
  const { activeGroups, add: addGroup } = useGroups();
  const { decide } = useTransactionDecision();
  const [draft, setDraft] = useState<DecisionStatus>(transaction.status === 'auto_hidden' ? 'ignored' : transaction.status);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const commit = (next: DecisionStatus, extra: { categoryId?: string; groupId?: string } = {}) => {
    setDraft(next);
    decide.mutate({ transaction, status: next, ...extra });
  };

  const handlePick = (next: Exclude<DecisionStatus, 'pending'>) => {
    if (next === 'group') {
      setDraft('group');
      return;
    }
    commit(next);
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    addGroup.mutate(name, {
      onSuccess: (group) => {
        setIsAddingGroup(false);
        setNewGroupName('');
        commit('group', { groupId: group.id });
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <DecisionPicker value={draft} onChange={handlePick} />

      {draft === 'mine' ? (
        <View style={styles.block}>
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>카테고리</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {activeCategories.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={transaction.category?.id === c.id}
                tone={categoryTones[c.colorToken]}
                onPress={() => commit('mine', { categoryId: c.id })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {draft === 'group' ? (
        <View style={styles.block}>
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>어느 모임?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {activeGroups.map((g) => (
              <Chip
                key={g.id}
                label={g.name}
                selected={transaction.status === 'group' && transaction.groupId === g.id}
                tone={status.group}
                onPress={() => commit('group', { groupId: g.id })}
              />
            ))}
            <Chip label="+ 새 모임" dashed onPress={() => setIsAddingGroup(true)} />
          </ScrollView>
          {isAddingGroup ? (
            <TextField placeholder="모임 이름" autoFocus value={newGroupName} onChangeText={setNewGroupName} onSubmitEditing={handleCreateGroup} returnKeyType="done" />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACE.md },
  block: { gap: SPACE.sm },
  chips: { gap: SPACE.sm },
});
