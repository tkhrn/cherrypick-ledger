import type { ReactNode } from 'react';
import { KeyboardAvoidingView, StyleSheet } from 'react-native';

/** 키보드가 올라오면 그만큼 화면을 줄인다 (안드로이드 edge-to-edge에서도 동작하도록 padding 방식) */
export function KeyboardLayout({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
