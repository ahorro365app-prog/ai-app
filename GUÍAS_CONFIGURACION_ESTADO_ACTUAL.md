# 🔧 GUÍAS Y CONFIGURACIÓN - DOCUMENTO MAESTRO

**Última actualización**: 2025-01-17 16:00:00 UTC  
**Versión**: 1.0  
**Este es el documento oficial y único de referencia para guías y configuraciones**

> ⚠️ **IMPORTANTE**: Este es el único documento de guías y configuraciones que debes consultar. Los demás documentos están obsoletos o son históricos.

---

## 📋 REGLAS DE USO Y ACTUALIZACIÓN

### 🔴 REGLAS OBLIGATORIAS

1. **SIEMPRE actualizar fecha y hora** al agregar o modificar una guía
   - Formato: `YYYY-MM-DD HH:MM:SS UTC`
   - Ubicación: Línea 3 del documento

2. **SIEMPRE actualizar el historial de cambios** al modificar una guía
   - Agregar entrada con fecha, hora, autor, descripción del cambio

3. **SIEMPRE verificar que la guía funciona** después de actualizarla
   - Probar los pasos en desarrollo
   - Documentar resultados en el historial

4. **NO modificar este documento** sin seguir estas reglas

---

## 📊 ÍNDICE DE GUÍAS

### 1. 🔍 Sentry (Monitoreo y Errores)
### 2. 🤖 Android/APK (Compilación)
### 3. 🐛 Debugging (Depuración)
### 4. 🎨 Iconos y Logo (Assets)
### 5. 🔐 Variables de Entorno (Configuración)

---

## 1. 🔍 SENTRY - MONITOREO Y ERRORES

### 1.1 ¿Qué es Sentry?
Sentry es una plataforma de monitoreo de errores que captura excepciones y errores en tiempo real. Plan gratuito: 5,000 eventos/mes.

### 1.2 Configuración Inicial

#### Paso 1: Crear Cuenta
1. Ve a https://sentry.io/signup/
2. Crea cuenta gratuita (GitHub/Google)
3. Verifica tu email

#### Paso 2: Crear Proyecto
1. Clic en **"Create Project"**
2. Selecciona **"Next.js"**
3. Nombre: `ahorro365-app`
4. Clic en **"Create Project"**

#### Paso 3: Obtener DSN
1. En la pantalla de configuración, copia el **DSN**
2. Formato: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

#### Paso 4: Configurar Variables de Entorno

**Archivo**: `.env.local` o variables de Vercel

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=ahorro365-app
SENTRY_AUTH_TOKEN=tu-auth-token
```

**Dónde obtener**:
- `NEXT_PUBLIC_SENTRY_DSN`: Pantalla de configuración del proyecto
- `SENTRY_ORG`: Settings → Organization Settings → Organization Slug
- `SENTRY_PROJECT`: Settings → Projects → Project Slug
- `SENTRY_AUTH_TOKEN`: Settings → Account → Auth Tokens → Create New Token

### 1.3 Configurar Alertas

#### Paso 1: Ir a Alertas
1. Dashboard → Alerts → Create Alert Rule

#### Paso 2: Configurar Regla
- **When**: An event is seen
- **Conditions**: 
  - Level: Error o Fatal
  - Count: > 0
- **Actions**: 
  - Send email to: tu-email@ejemplo.com

#### Paso 3: Guardar
- Nombre: "Errores Críticos"
- Guardar regla

### 1.4 Verificar Funcionamiento

#### Test Manual
1. Agregar código de prueba en un endpoint:
```typescript
throw new Error('Test Sentry Error');
```

2. Ejecutar el endpoint
3. Verificar en Sentry Dashboard que el error aparece

#### Ver Logs
- Dashboard → Issues → Ver errores capturados
- Cada error muestra: stack trace, contexto, usuario afectado

### 1.5 Archivos Relacionados
- `sentry.client.config.ts` - Configuración cliente
- `sentry.server.config.ts` - Configuración servidor
- `sentry.edge.config.ts` - Configuración Edge Runtime
- `instrumentation.ts` - Inicialización de Sentry

---

## 2. 🤖 ANDROID/APK - COMPILACIÓN

### 2.1 Método Rápido (Recomendado)

#### Compilar APK con un comando:
```bash
npm run build:apk
```

**Este comando hace**:
1. ✅ Compila la app Next.js
2. ✅ Copia archivos estáticos
3. ✅ Sincroniza con Capacitor
4. ✅ Compila el APK automáticamente

**Resultado**: APK en `android/app/build/outputs/apk/debug/app-debug.apk`

### 2.2 Método Paso a Paso

#### Paso 1: Build de Next.js
```bash
npm run build
```

#### Paso 2: Copiar archivos estáticos
```bash
node scripts/copy-static-for-capacitor.js
```

#### Paso 3: Sincronizar con Capacitor
```bash
npx cap sync android
```

#### Paso 4: Compilar APK
```bash
cd android
gradlew.bat assembleDebug  # Windows
./gradlew assembleDebug    # Linux/Mac
```

### 2.3 Compilar APK Release (Firmado)

#### Paso 1: Configurar Keystore
1. Crear keystore (si no existe):
```bash
keytool -genkey -v -keystore ahorro365-release-key.keystore -alias ahorro365 -keyalg RSA -keysize 2048 -validity 10000
```

2. Guardar keystore en `android/app/`

#### Paso 2: Configurar `android/app/build.gradle`
```gradle
android {
    signingConfigs {
        release {
            storeFile file('ahorro365-release-key.keystore')
            storePassword 'tu-password'
            keyAlias 'ahorro365'
            keyPassword 'tu-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### Paso 3: Compilar Release
```bash
cd android
gradlew.bat assembleRelease  # Windows
./gradlew assembleRelease    # Linux/Mac
```

**Resultado**: APK en `android/app/build/outputs/apk/release/app-release.apk`

### 2.4 Solución de Problemas Comunes

#### Error: Java Version
- **Problema**: Versión incorrecta de Java
- **Solución**: Usar Java 17 (verificar con `java -version`)
- **Configurar**: `JAVA_HOME` apunta a Java 17

#### Error: Gradle Build Failed
- **Problema**: Dependencias o configuración incorrecta
- **Solución**: 
  1. Limpiar: `cd android && gradlew clean`
  2. Re-sincronizar: `npx cap sync android`
  3. Reintentar build

#### Error: Capacitor Sync Failed
- **Problema**: Archivos no copiados correctamente
- **Solución**: 
  1. Verificar que `out/` existe después de `npm run build`
  2. Ejecutar `node scripts/copy-static-for-capacitor.js` manualmente
  3. Verificar que `android/app/src/main/assets/public/` tiene archivos

### 2.5 Archivos Relacionados
- `capacitor.config.ts` - Configuración de Capacitor
- `android/app/build.gradle` - Configuración de Gradle
- `scripts/copy-static-for-capacitor.js` - Script de copia
- `scripts/build-apk.js` - Script de compilación

---

## 3. 🐛 DEBUGGING - DEPURACIÓN

### 3.1 Debugging en Android (Chrome DevTools)

#### Paso 1: Habilitar USB Debugging
1. En el teléfono: Settings → About Phone
2. Toca "Build Number" 7 veces
3. Settings → Developer Options → Enable USB Debugging

#### Paso 2: Conectar Teléfono
1. Conecta teléfono a PC con USB
2. Acepta "Allow USB Debugging" en el teléfono

#### Paso 3: Verificar Conexión
```bash
adb devices
```

**Debería mostrar**:
```
List of devices attached
XXXXXXXXX    device
```

#### Paso 4: Abrir Chrome DevTools
1. Abre Chrome en PC
2. Ve a: `chrome://inspect`
3. Busca tu dispositivo y app
4. Clic en "inspect"

#### Paso 5: Debug
- **Console**: Ver logs y errores
- **Network**: Ver requests HTTP
- **Sources**: Ver código fuente
- **Application**: Ver localStorage, cookies, etc.

### 3.2 Debugging en Desarrollo (localhost)

#### Ver Logs en Consola
```bash
npm run dev
```

Los logs aparecen en:
- Terminal donde ejecutaste `npm run dev`
- Consola del navegador (F12)

#### Ver Logs de API
Los endpoints de API loguean en:
- Terminal del servidor
- Archivos de log (si están configurados)

### 3.3 Debugging de Errores Específicos

#### Error: "Connection closed"
- **Causa**: React Server Components en app estática
- **Solución**: Verificar `output: 'export'` en `next.config.js`

#### Error: "Module not found"
- **Causa**: Import incorrecto o archivo no existe
- **Solución**: Verificar ruta del import

#### Error: "Cannot read property X of undefined"
- **Causa**: Variable no inicializada
- **Solución**: Agregar validación o valor por defecto

### 3.4 Archivos Relacionados
- `GUIA_DEBUGGING_ANDROID.md` (obsoleto - ver este documento)
- `INSTRUCCIONES_DEBUGGING_PASO_A_PASO.md` (obsoleto - ver este documento)

---

## 4. 🎨 ICONOS Y LOGO - ASSETS

### 4.1 Cambiar Icono de la App

#### Método 1: Capacitor Assets (Recomendado)

#### Paso 1: Preparar Imagen
- **Formato**: PNG
- **Tamaño**: 1024x1024 px (mínimo)
- **Fondo**: Transparente o sólido
- **Nombre**: `icon.png`

#### Paso 2: Colocar Imagen
Coloca `icon.png` en la raíz del proyecto

#### Paso 3: Generar Iconos
```bash
npm run generate:icons
```

**O solo Android**:
```bash
npm run generate:icons:android
```

**Esto genera**:
- Iconos para Android (múltiples tamaños)
- Iconos para iOS (si aplica)
- Splash screens

#### Paso 4: Sincronizar
```bash
npx cap sync android
```

#### Método 2: Manual

#### Android
1. Coloca iconos en `android/app/src/main/res/`:
   - `mipmap-mdpi/ic_launcher.png` (48x48)
   - `mipmap-hdpi/ic_launcher.png` (72x72)
   - `mipmap-xhdpi/ic_launcher.png` (96x96)
   - `mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `mipmap-xxxhdpi/ic_launcher.png` (192x192)

2. Recompilar APK

### 4.2 Cambiar Logo en la App

#### Paso 1: Preparar Imagen
- **Formato**: PNG o SVG
- **Tamaño**: Recomendado 512x512 px
- **Nombre**: `logo.png`

#### Paso 2: Colocar en Public
Coloca `logo.png` en `public/logo.png`

#### Paso 3: Usar en Código
```tsx
import Image from 'next/image';

<Image src="/logo.png" alt="Logo" width={512} height={512} />
```

### 4.3 Archivos Relacionados
- `assets/` - Carpeta de assets
- `public/logo.png` - Logo de la app
- `capacitor.config.ts` - Configuración de iconos

---

## 5. 🔐 VARIABLES DE ENTORNO - CONFIGURACIÓN

### 5.1 Variables Críticas (Requeridas)

#### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Dónde obtener**:
- Supabase Dashboard → Settings → API

#### Upstash Redis (Rate Limiting)
```bash
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

**Dónde obtener**:
- Upstash Dashboard → Redis → REST API

#### Sentry (Opcional)
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=tu-organizacion
SENTRY_PROJECT=ahorro365-app
SENTRY_AUTH_TOKEN=tu-auth-token
```

**Dónde obtener**:
- Sentry Dashboard → Settings

### 5.2 Variables por Componente

#### App Principal
- Todas las variables de Supabase
- Variables de Sentry (opcional)
- Variables de Upstash (opcional)

#### Admin Panel
- Todas las variables de Supabase
- Variables de Sentry (opcional)
- Variables de Upstash (opcional)
- `JWT_SECRET` - Secreto para tokens JWT

#### Core API
- Todas las variables de Supabase
- Variables de Upstash (requerido para rate limiting)
- Variables de Sentry (opcional)

### 5.3 Configurar en Vercel

#### Paso 1: Ir a Settings
1. Vercel Dashboard → Tu Proyecto → Settings → Environment Variables

#### Paso 2: Agregar Variables
1. Clic en "Add New"
2. Ingresa nombre y valor
3. Selecciona ambientes: Production, Preview, Development
4. Guardar

#### Paso 3: Redeploy
1. Después de agregar variables, hacer redeploy
2. Las variables estarán disponibles en el próximo deploy

### 5.4 Configurar en Desarrollo

#### Archivo `.env.local`
```bash
# Copiar de .env.example o crear nuevo
cp env-example.txt .env.local

# Editar con tus valores
# .env.local no se sube a Git (está en .gitignore)
```

### 5.5 Verificar Variables

#### Test Rápido
```bash
# En Node.js
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

# Debe mostrar la URL, no undefined
```

### 5.6 Archivos Relacionados
- `.env.local` - Variables locales (no subir a Git)
- `.env.example` - Ejemplo de variables
- `env-example.txt` - Template de variables

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-17 16:00:00 UTC - Versión 1.0
**Autor**: Sistema de consolidación  
**Cambios**:
- ✅ Consolidación completa de guías y configuraciones
- ✅ Agregadas reglas de uso y actualización
- ✅ Organizadas por categorías (Sentry, Android, Debugging, Iconos, Variables)
- ✅ Historial de cambios implementado

**Componentes afectados**: Todos (documentación)

---

## 📝 NOTAS IMPORTANTES

1. **Este es el único documento oficial** de guías y configuraciones
2. **Los demás documentos** están obsoletos o son históricos
3. **Siempre actualizar fecha/hora** al modificar guías
4. **Siempre verificar** que las guías funcionan después de actualizarlas
5. **Documentar cambios** en el historial

---

**Última actualización**: 2025-01-17 16:00:00 UTC  
**Próxima revisión programada**: 2025-02-17

