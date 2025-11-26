# 📱 Configuración de Notificaciones Push para Móvil (Android/iOS)

**Última actualización**: 2025-11-24  
**Versión**: 1.0

## 📋 Resumen

Este documento explica cómo configurar las notificaciones push para que funcionen en dispositivos móviles (Android/iOS) cuando el dispositivo está bloqueado o la app está en segundo plano.

## ✅ Estado Actual

- ✅ Plugin `@capacitor/push-notifications` instalado
- ✅ Configuración en `capacitor.config.ts` completada
- ✅ Hook `useRegisterFcmToken` actualizado para soportar móvil
- ⚠️ **Pendiente**: Configurar `google-services.json` para Android
- ⚠️ **Pendiente**: Configurar APNs para iOS (si aplica)

---

## 🔧 Configuración para Android

### Paso 1: Obtener `google-services.json` de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **⚙️ Configuración del proyecto** → **General**
4. En la sección **"Tus aplicaciones"**, busca la app Android o haz clic en **"Agregar app"** → **Android**
5. Ingresa:
   - **Nombre del paquete Android**: `com.ahorro365.app`
   - **Apodo de la app** (opcional): `Ahorro365`
6. Haz clic en **"Registrar app"**
7. **Descarga el archivo `google-services.json`**

### Paso 2: Colocar `google-services.json` en el proyecto

Coloca el archivo descargado en:
```
android/app/google-services.json
```

**Importante**: El archivo debe estar exactamente en `android/app/`, no en otra ubicación.

### Paso 3: Verificar que el plugin de Google Services esté configurado

El archivo `android/app/build.gradle` ya tiene la configuración para detectar automáticamente `google-services.json`:

```gradle
try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
```

### Paso 4: Sincronizar Capacitor

Después de agregar `google-services.json`, ejecuta:

```bash
npx cap sync android
```

### Paso 5: Recompilar la app

```bash
# Desde Android Studio o desde la terminal
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## 🍎 Configuración para iOS (Opcional)

Si planeas publicar en iOS, necesitarás:

1. **Certificado APNs** en Firebase Console
2. **Configurar `GoogleService-Info.plist`** en el proyecto iOS
3. **Habilitar Push Notifications** en Xcode

**Nota**: Este proceso es más complejo y requiere una cuenta de desarrollador de Apple. Consulta la [documentación oficial de Capacitor](https://capacitorjs.com/docs/guides/push-notifications-firebase) para más detalles.

---

## 🧪 Pruebas

### Verificar que el token se registre

1. Abre la app en un dispositivo Android real (las notificaciones push no funcionan en emuladores)
2. Inicia sesión
3. Revisa los logs de la consola para ver:
   ```
   FCM token obtenido en móvil: [token]
   ```
4. Verifica en Supabase que el token se guardó en `fcm_tokens` con `device_type = 'android'`

### Enviar notificación de prueba

1. Ve al panel de administración: `/notifications`
2. Selecciona el token del dispositivo móvil
3. Envía una notificación de prueba
4. **Con la app en segundo plano o el dispositivo bloqueado**, deberías recibir la notificación

---

## 🔍 Solución de Problemas

### Error: "google-services.json not found"

**Solución**: Asegúrate de que el archivo esté en `android/app/google-services.json` y ejecuta `npx cap sync android`.

### Las notificaciones no llegan cuando el dispositivo está bloqueado

**Verifica**:
1. ✅ `google-services.json` está en la ubicación correcta
2. ✅ El token se registró correctamente (revisa `fcm_tokens` en Supabase)
3. ✅ Los permisos de notificación están habilitados en el dispositivo
4. ✅ La app está compilada con el `google-services.json` incluido

### Token no se registra en móvil

**Verifica**:
1. ✅ El plugin `@capacitor/push-notifications` está instalado
2. ✅ `npx cap sync android` se ejecutó después de instalar el plugin
3. ✅ Los permisos de notificación fueron otorgados
4. ✅ Revisa los logs de la consola para ver errores específicos

---

## 📚 Referencias

- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging para Android](https://firebase.google.com/docs/cloud-messaging/android/client)
- [Configuración de FCM en Capacitor](https://capacitorjs.com/docs/guides/push-notifications-firebase)

---

## ✅ Checklist de Implementación

- [ ] `google-services.json` descargado de Firebase
- [ ] `google-services.json` colocado en `android/app/`
- [ ] `npx cap sync android` ejecutado
- [ ] App recompilada con el nuevo `google-services.json`
- [ ] Token registrado en dispositivo real
- [ ] Notificación de prueba enviada y recibida
- [ ] Notificación recibida con dispositivo bloqueado ✅

---

**Nota**: Las notificaciones push en móvil **solo funcionan en dispositivos reales**, no en emuladores.

