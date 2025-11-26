import type { CapacitorConfig } from '@capacitor/cli';

// Configuración del servidor remoto para APIs
// IMPORTANTE: NO usamos server.url aquí porque queremos cargar la UI desde archivos locales
// Las APIs se llamarán al servidor remoto usando NEXT_PUBLIC_API_URL en el código
const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.CAPACITOR_SERVER_URL ||
  'https://ai-app-core-api.vercel.app'; // URL de producción en Vercel (core-api separado)

const config: CapacitorConfig = {
  appId: 'com.ahorro365.app',
  appName: 'Ahorro365',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // NO configuramos 'url' aquí - queremos cargar la UI desde archivos locales
    // Las llamadas API se harán al servidor remoto usando NEXT_PUBLIC_API_URL
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
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
