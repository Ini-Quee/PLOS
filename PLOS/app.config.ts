import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
  const isPreview = process.env.EAS_BUILD_PROFILE === 'preview';

  // API URL based on build profile
  let apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  if (isProduction) {
    apiUrl = process.env.EXPO_PUBLIC_API_URL_PROD || 'https://api.timeq.app';
  } else if (isPreview) {
    apiUrl = process.env.EXPO_PUBLIC_API_URL_PREVIEW || 'https://staging-api.timeq.app';
  }

  return {
    ...config,
    name: isProduction ? 'iNiQ' : isPreview ? 'iNiQ Preview' : 'iNiQ Dev',
    slug: 'iniq',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'iniq',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#080503',
    },
    ios: {
      ...config.ios,
      supportsTablet: true,
      bundleIdentifier: isProduction
        ? 'com.timeq.app'
        : isPreview
        ? 'com.timeq.app.preview'
        : 'com.timeq.app.dev',
      buildNumber: '1',
      infoPlist: {
        NSMicrophoneUsageDescription:
          'TimeQ uses your microphone for voice journaling and talking to Lumi.',
        NSCameraUsageDescription:
          'TimeQ uses your camera to capture photos for your journal.',
        NSFaceIDUsageDescription:
          'TimeQ uses Face ID to keep your data secure.',
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      ...config.android,
      package: isProduction
        ? 'com.timeq.app'
        : isPreview
        ? 'com.timeq.app.preview'
        : 'com.timeq.app.dev',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#080503',
      },
      edgeToEdgeEnabled: true,
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED',
        'SCHEDULE_EXACT_ALARM',
      ],
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-camera',
        {
          cameraPermission:
            'TimeQ uses your camera to capture photos for your journal.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission:
            'TimeQ uses your microphone for voice journaling and talking to Lumi.',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission: 'TimeQ uses Face ID to keep your data secure.',
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#C8955C',
          sounds: [],
        },
      ],
    ],
    extra: {
      ...config.extra,
      apiUrl,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || '',
      },
    },
  };
};
