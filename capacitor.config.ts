import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ahorro365.app',
  appName: 'Ahorro365',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    ScreenOrientation: {
      orientation: 'portrait'
    },
    Permissions: {
      microphone: {
        android: {
          permissions: ['android.permission.RECORD_AUDIO']
        },
        ios: {
          usageDescription: 'Esta aplicación necesita acceso al micrófono para grabar tus gastos por voz.'
        }
      }
    }
  }
};

export default config;
