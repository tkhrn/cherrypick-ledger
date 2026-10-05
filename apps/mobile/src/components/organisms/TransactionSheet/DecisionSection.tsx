import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/atoms/Chip';
import { DecisionPicker } from '@/components/molecules/DecisionPicker';
import { SheetTextField } from '@/components/molecules/SheetTextField';
import { FONT, SPACE } from '@/constants/theme';
import { useCategories } from '@/hooks/useCategories';
import { useGroups } from '@/hooks/useGroups';
import { useTheme } from '@/hooks/useTheme';
import type { DecisionStatus } from '@/types/transaction';
import type { SheetDraft } from './draft';

interface DecisionSectionProps {
  draft: SheetDraft;
  onChange: (patch: Partial<SheetDraft>) => void;
  onIgnore: () => void;
}

/** 세 갈래 결정 + 카테고리·모임 선택. 고른 값은 저장을 눌러야 반영된다 (무시는 바로 저장) */
export function DecisionSection({ draft, onChange, onIgnore }: DecisionSectionProps) {
  const { colors, categories: categoryTones, status } = useTheme();
  const { activeCategories } = useCategories();
  const { activeGroups, add: addGroup } = useGroups();
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handlePick = (next: Exclude<DecisionStatus, 'pending'>) => {
    if (next === 'ignored') {
      onIgnore();
      return;
    }
    onChange({ status: next });
  };

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    addGroup.mutate(name, {
      onSuccess: (group) => {
        setIsAddingGroup(false);
        setNewGroupName('');
        onChange({ status: 'group', groupId: group.id });
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <DecisionPicker value={draft.status} onChange={handlePick} />

      {draft.status === 'mine' ? (
        <View style={styles.block}>
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>카테고리</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            {activeCategories.map((c) => (
              <Chip key={c.id} label={c.name} selected={draft.categoryId === c.id} tone={categoryTones[c.colorToken]} onPress={() => onChange({ categoryId: c.id })} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {draft.status === 'group' ? (
        <View style={styles.block}>
          <Text style={[FONT.caption, { color: colors.textSecondary }]}>어느 모임?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
            {activeGroups.map((g) => (
              <Chip key={g.id} label={g.name} selected={draft.groupId === g.id} tone={status.group} onPress={() => onChange({ groupId: g.id })} />
            ))}
            <Chip label="+ 새 모임" dashed onPress={() => setIsAddingGroup(true)} />
          </ScrollView>
          {isAddingGroup ? (
            <SheetTextField placeholder="모임 이름" autoFocus value={newGroupName} onChangeText={setNewGroupName} onSubmitEditing={handleCreateGroup} returnKeyType="done" />
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
