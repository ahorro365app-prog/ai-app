# 🔍 Guía de Debug: Notificaciones en Móvil

## 📱 Cómo Revisar Logs desde Chrome DevTools

### Paso 1: Conectar el Dispositivo

1. **Habilita USB Debugging** en tu dispositivo Android:
   - Ve a **Configuración** → **Opciones de desarrollador**
   - Activa **Depuración USB**

2. **Conecta el dispositivo** por USB a tu computadora

3. **Abre Chrome** en tu computadora

4. **Ve a**: `chrome://inspect/#devices`

5. **Busca tu dispositivo** en la lista

6. **Haz clic en "inspect"** junto a tu app

### Paso 2: Ver los Logs

1. **Abre la pestaña "Console"** en DevTools

2. **Filtra por palabras clave**:
   - `FCM`
   - `token`
   - `registration`
   - `notification`
   - `preference`

3. **Busca estos mensajes específicos**:

#### ✅ Mensajes que DEBEN aparecer:
```
Registrando PushNotifications...
PushNotifications.register() completado exitosamente
Evento registration recibido: { hasToken: true, tokenLength: ... }
FCM token obtenido en móvil: ...
Registrando token en: https://ahorro365-core-api.vercel.app/api/notifications/register-token
Token registrado exitosamente en backend
```

#### ❌ Mensajes de ERROR a buscar:
```
Error registrando push notifications en móvil
Error al llamar PushNotifications.register()
Error en respuesta del servidor
Error registrando token FCM en móvil
Error actualizando preferencias
```

### Paso 3: Verificar el Estado del Token

En la consola, ejecuta:
```javascript
// Ver el estado del token FCM
const status = JSON.parse(localStorage.getItem('ahorro365:fcmStatus') || '{}');
console.log('Estado FCM:', status);
```

**Estados posibles**:
- `registered`: ✅ Token registrado correctamente
- `pending`: ⏳ Intentando registrar
- `denied`: ❌ Permisos denegados
- `error`: ❌ Error al registrar
- `signed_out`: 👤 Usuario no ha iniciado sesión

### Paso 4: Verificar Permisos

En la consola, ejecuta:
```javascript
// Verificar permisos de notificaciones
import('@capacitor/push-notifications').then(({ PushNotifications }) => {
  PushNotifications.checkPermissions().then(status => {
    console.log('Estado de permisos:', status);
  });
});
```

**Estados esperados**:
- `{ receive: 'granted' }`: ✅ Permisos otorgados
- `{ receive: 'denied' }`: ❌ Permisos denegados
- `{ receive: 'prompt' }`: ⏳ Pendiente de solicitar

### Paso 5: Verificar Errores de Preferencias

Cuando intentes actualizar preferencias, busca en la consola:
```javascript
// Ver el error exacto
// Busca mensajes que contengan:
// - "Error actualizando preferencias"
// - "failed to search"
// - "Error en respuesta del servidor"
```

## 🐛 Problemas Comunes y Soluciones

### Problema 1: No aparece el mensaje de aceptar notificaciones

**Posibles causas**:
1. Los permisos ya están otorgados (verificar en Configuración del dispositivo)
2. El hook no se está ejecutando
3. Hay un error silencioso

**Solución**:
- Verificar en logs si aparece "Registrando PushNotifications..."
- Verificar permisos en Configuración del dispositivo
- Verificar si hay errores en la consola

### Problema 2: Token no se registra (is_active = false)

**Posibles causas**:
1. El listener no se está ejecutando
2. Error en la petición al API
3. El token es inválido

**Solución**:
- Verificar en logs si aparece "Evento registration recibido"
- Verificar si hay errores en la petición al API
- Verificar el estado en localStorage

### Problema 3: Error "failed to search" al actualizar preferencias

**Posibles causas**:
1. Error en la query de Supabase
2. Problema de permisos en la tabla
3. El userId no es válido

**Solución**:
- Verificar el error exacto en los logs
- Verificar que el userId sea correcto
- Verificar permisos de la tabla `notification_preferences`

## 📋 Checklist de Debug

- [ ] Dispositivo conectado por USB
- [ ] Chrome DevTools abierto
- [ ] Consola visible y filtrada
- [ ] App abierta y usuario iniciado sesión
- [ ] Logs capturados durante el proceso
- [ ] Estado del token verificado en localStorage
- [ ] Permisos verificados
- [ ] Errores documentados

## 💡 Información a Compartir

Cuando revises los logs, comparte:

1. **Mensajes de la consola** (especialmente errores)
2. **Estado del token** (del localStorage)
3. **Estado de permisos** (del checkPermissions)
4. **Errores específicos** al actualizar preferencias
5. **Screenshots** si es posible

Esto ayudará a identificar el problema exacto.

