import type { ConfigContext, ExpoConfig } from 'expo/config';

// APP_VARIANT=development 이면 개발용 앱으로 따로 설치된다 (배포용 앱과 나란히 둘 수 있게 패키지·이름·스킴을 분리)
const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  name: IS_DEV ? 'Cherrypick (dev)' : 'Cherrypick',
  scheme: IS_DEV ? 'cherrypick-dev' : 'cherrypick',
  android: {
    ...config.android,
    package: IS_DEV ? 'com.tkhrn.cherrypick.dev' : 'com.tkhrn.cherrypick',
  },
});
