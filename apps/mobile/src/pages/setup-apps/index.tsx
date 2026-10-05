import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/atoms/Button';
import { SourceAppPicker } from '@/components/organisms/SourceAppPicker';
import { SPACE } from '@/constants/theme';
import { useCaptureSources } from '@/hooks/useCaptureSources';
import type { InstalledApp } from '@/hooks/useInstalledApps';
import { useTheme } from '@/hooks/useTheme';

export default function SetupAppsPage() {
  const { colors } = useTheme();
  const { enabledApps, smsEnabled, save } = useCaptureSources();
  const [edited, setEdited] = useState<Map<string, InstalledApp> | null>(null);
  const selected = edited ?? new Map(enabledApps.map((a) => [a.package_name, { packageName: a.package_name, label: a.label }]));

  const handleToggle = (app: InstalledApp) => {
    const next = new Map(selected);
    if (next.has(app.packageName)) next.delete(app.packageName);
    else next.set(app.packageName, app);
    setEdited(next);
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.bgPage }]}>
      <SourceAppPicker selected={new Set(selected.keys())} onToggle={handleToggle} />
      <View style={styles.footer}>
        <Button
          label="저장"
          variant="primary"
          disabled={selected.size === 0}
          isLoading={save.isPending}
          onPress={() => save.mutate({ selected: [...selected.values()], smsEnabled }, { onSuccess: () => router.back() })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, paddingTop: SPACE.md }, footer: { padding: SPACE.lg } });
