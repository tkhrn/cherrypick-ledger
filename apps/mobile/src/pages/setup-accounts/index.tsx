import { ScrollView } from 'react-native';
import { MyAccountsEditor } from '@/components/organisms/MyAccountsEditor';
import { SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function SetupAccountsPage() {
  const { colors } = useTheme();
  return (
    <ScrollView style={{ backgroundColor: colors.bgPage }} contentContainerStyle={{ paddingVertical: SPACE.lg }} keyboardShouldPersistTaps="handled">
      <MyAccountsEditor />
    </ScrollView>
  );
}
