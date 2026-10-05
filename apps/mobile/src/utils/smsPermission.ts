import { PermissionsAndroid, Platform } from 'react-native';

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
