import { KeyboardLayout } from '@/components/layouts/KeyboardLayout';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { CategoryIcon } from '@/components/atoms/CategoryIcon';
import { TextField } from '@/components/atoms/TextField';
import { FONT, ROW_HEIGHT, SPACE, CATEGORY_COLOR_TOKENS, type CategoryColorToken } from '@/constants/theme';
import { useCategories } from '@/hooks/useCategories';
import { useTheme } from '@/hooks/useTheme';

const NEW_CATEGORY_ICON = 'dots';
const COLOR_SWATCH = 28;

export default function SetupCategoriesPage() {
  const { colors, categories: tones } = useTheme();
  const { categories, add, update } = useCategories();
  const [name, setName] = useState('');
  const [color, setColor] = useState<CategoryColorToken>('cat-blue');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    add.mutate({ name: name.trim(), icon: NEW_CATEGORY_ICON, colorToken: color, sortOrder: categories.length + 1 }, { onSuccess: () => setName('') });
  };

  const handleRename = (id: string) => {
    if (editingName.trim()) update.mutate({ id, name: editingName.trim() });
    setEditingId(null);
  };

  return (
    <KeyboardLayout>
    <ScrollView style={{ backgroundColor: colors.bgPage }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {categories.map((c) => (
        <View key={c.id} style={[styles.row, { backgroundColor: colors.bgSurface, borderBottomColor: colors.border, opacity: c.archived ? 0.5 : 1 }]}>
          <CategoryIcon icon={c.icon} colorToken={c.colorToken} />
          {editingId === c.id ? (
            <View style={styles.grow}>
              <TextField value={editingName} onChangeText={setEditingName} autoFocus onSubmitEditing={() => handleRename(c.id)} onBlur={() => handleRename(c.id)} />
            </View>
          ) : (
            <Pressable style={styles.grow} onPress={() => { setEditingId(c.id); setEditingName(c.name); }}>
              <Text style={[FONT.body, { color: colors.textPrimary }]}>{c.name}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => update.mutate({ id: c.id, archived: !c.archived })} hitSlop={SPACE.sm}>
            <Text style={[FONT.caption, { color: colors.accent }]}>{c.archived ? '복원' : '보관'}</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.form}>
        <TextField label="새 카테고리" placeholder="반려동물" value={name} onChangeText={setName} />
        <View style={styles.swatches}>
          {CATEGORY_COLOR_TOKENS.map((token) => (
            <Pressable
              key={token}
              accessibilityRole="radio"
              accessibilityLabel={token}
              accessibilityState={{ selected: color === token }}
              onPress={() => setColor(token)}
              style={[styles.swatch, { backgroundColor: tones[token].bar, borderColor: color === token ? colors.textPrimary : 'transparent' }]}
            />
          ))}
        </View>
        <Button label="카테고리 추가" onPress={handleAdd} isLoading={add.isPending} />
      </View>
    </ScrollView>
    </KeyboardLayout>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: SPACE.lg },
  row: { minHeight: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: SPACE.md, paddingHorizontal: SPACE.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  grow: { flex: 1 },
  form: { padding: SPACE.lg, gap: SPACE.md },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  swatch: { width: COLOR_SWATCH, height: COLOR_SWATCH, borderRadius: COLOR_SWATCH / 2, borderWidth: 2 },
});
