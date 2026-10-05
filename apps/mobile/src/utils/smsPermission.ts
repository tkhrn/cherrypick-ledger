import { PermissionsAndroid, Platform } from 'react-native';

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/** 지난 문자 가져오기용 읽기 권한 */
export async function requestReadSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}
