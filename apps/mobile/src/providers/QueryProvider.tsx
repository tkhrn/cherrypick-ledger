import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

const ONE_MINUTE_MS = 60 * 1000;
const MAX_RETRY_DELAY_MS = 30 * 1000;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: ONE_MINUTE_MS,
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS),
          },
          mutations: { retry: 0 },
        },
      }),
  );
  // 앱이 다시 앞으로 오면 오래된 쿼리를 새로 고친다 (React Native에는 window focus가 없다)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
