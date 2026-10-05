import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { updateUserSettings } from '@/apis/user_settings';
import { useUserSettings } from './useUserSettings';

async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: '정리 알림', importance: Notifications.AndroidImportance.DEFAULT });
  }
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

/** 하루 한 번 정리 알림을 받을 푸시 토큰을 등록하고, 알림을 누르면 정리 탭으로 보낸다 */
export function usePushRegistration() {
  const { settings } = useUserSettings();
  const savedToken = settings?.expo_push_token ?? null;
  const hasSettings = settings !== null;

  useEffect(() => {
    if (!hasSettings) return;
    getPushToken()
      .then((token) => (token && token !== savedToken ? updateUserSettings({ expo_push_token: token }) : undefined))
      .catch(() => undefined); // FCM 설정 전이거나 에뮬레이터면 토큰 없이 계속 쓴다
  }, [hasSettings, savedToken]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(() => router.navigate('/'));
    return () => subscription.remove();
  }, []);
}
