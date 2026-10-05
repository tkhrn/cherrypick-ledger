import { useMemo, useState } from 'react';
import { ActivityIndicator, SectionList, StyleSheet, View } from 'react-native';
import { TextField } from '@/components/atoms/TextField';
import { CheckRow } from '@/components/molecules/CheckRow';
import { SectionHeader } from '@/components/molecules/SectionHeader';
import { SPACE } from '@/constants/theme';
import { useInstalledApps, type InstalledApp } from '@/hooks/useInstalledApps';
import { isLikelyFinancialApp } from '@/utils/financialApps';

interface SourceAppPickerProps {
  selected: ReadonlySet<string>;
  onToggle: (app: InstalledApp) => void;
}

export function SourceAppPicker({ selected, onToggle }: SourceAppPickerProps) {
  const { apps, isLoading } = useInstalledApps();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const matched = keyword ? apps.filter((a) => a.label.toLowerCase().includes(keyword) || a.packageName.includes(keyword)) : apps;
    return [
      { title: '금융앱으로 보여요', data: matched.filter(isLikelyFinancialApp) },
      { title: '다른 앱', data: matched.filter((a) => !isLikelyFinancialApp(a)) },
    ].filter((s) => s.data.length > 0);
  }, [apps, query]);

  if (isLoading) return <ActivityIndicator style={styles.loading} />;

  return (
    <View style={styles.fill}>
      <View style={styles.search}>
        <TextField placeholder="앱 이름 검색" value={query} onChangeText={setQuery} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(app) => app.packageName}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderItem={({ item }) => (
          <CheckRow label={item.label} description={item.packageName} checked={selected.has(item.packageName)} onPress={() => onToggle(item)} />
        )}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  search: { paddingHorizontal: SPACE.lg, paddingBottom: SPACE.sm },
  loading: { marginTop: SPACE.xl },
});
