import { IconInbox, IconNotebook, IconSettings, IconWallet } from '@tabler/icons-react-native';
import { Tabs } from 'expo-router';
import { useDeviceRegistration } from '@/hooks/useDeviceRegistration';
import { usePushRegistration } from '@/hooks/usePushRegistration';
import { useTheme } from '@/hooks/useTheme';

const TAB_ICON_SIZE = 22;

export default function TabsLayout() {
  const { colors } = useTheme();
  usePushRegistration();
  useDeviceRegistration();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.bgSurface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '정리', tabBarIcon: ({ color }) => <IconInbox size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="spending" options={{ title: '내 소비', tabBarIcon: ({ color }) => <IconWallet size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="groups" options={{ title: '모임장부', tabBarIcon: ({ color }) => <IconNotebook size={TAB_ICON_SIZE} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: ({ color }) => <IconSettings size={TAB_ICON_SIZE} color={color} /> }} />
    </Tabs>
  );
}
