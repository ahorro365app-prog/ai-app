# 🧪 Guía Rápida: Probar CORS Localmente

## Paso 1: Obtener tu IP Local

Abre PowerShell y ejecuta:
```powershell
ipconfig
```

Busca "IPv4 Address" en tu adaptador de red (WiFi o Ethernet). Debería ser algo como:
- `192.168.1.XXX`
- `10.0.0.XXX`
- `192.168.0.XXX`

**Ejemplo**: `192.168.1.100`

## Paso 2: Iniciar Core API Localmente

Abre una terminal y ejecuta:
```bash
cd packages/core-api
npm run dev
```

Deberías ver:
```
Ready on http://localhost:3002
```

**Mantén esta terminal abierta** mientras pruebas.

## Paso 3: Configurar la URL Temporal en la App

Edita el archivo: `src/lib/apiConfig.ts`

Cambia esta línea:
```typescript
// ANTES:
const TEMP_LOCAL_API_URL: string | null = null;

// DESPUÉS (usa tu IP local):
const TEMP_LOCAL_API_URL: string | null = 'http://192.168.1.100:3002'; // ⬅️ Cambia por tu IP
```

## Paso 4: Verificar Firewall de Windows

1. Abre **Windows Defender Firewall**
2. Ve a **Configuración avanzada**
3. Verifica que el puerto **3002** esté permitido
4. Si no, agrega una regla de entrada para el puerto 3002

## Paso 5: Verificar que el Dispositivo Pueda Acceder

**IMPORTANTE**: Tu dispositivo Android y tu computadora deben estar en la **misma red WiFi**.

1. En tu dispositivo Android, abre el navegador
2. Ve a: `http://TU_IP_LOCAL:3002/api/ping`
   - Ejemplo: `http://192.168.1.100:3002/api/ping`
3. Deberías ver una respuesta JSON como: `{"message":"pong"}`

Si no funciona:
- Verifica que ambos estén en la misma red WiFi
- Verifica que el firewall permita el puerto 3002
- Verifica que el core-api esté corriendo

## Paso 6: Recompilar la APK

```bash
npm run build:apk
```

## Paso 7: Probar en el Dispositivo

1. Instala la nueva APK
2. Inicia sesión
3. Ve a **Ajustes → Notificaciones**
4. Intenta **desactivar/activar** una preferencia
5. **Debería funcionar sin error de CORS** ✅

## Paso 8: Verificar Logs del Core API

En la terminal donde está corriendo el core-api, deberías ver:
```
PUT /api/notifications/preferences 200
```

Si ves errores, compártelos.

## Paso 9: Revertir Cambios (Después de Probar)

**IMPORTANTE**: Después de probar, revierte el cambio:

Edita `src/lib/apiConfig.ts`:
```typescript
// Volver a:
const TEMP_LOCAL_API_URL: string | null = null;
```

Y recompila la APK para producción.

## 🔍 Troubleshooting

### Error: "No se puede conectar"
- ✅ Verifica que el dispositivo y la computadora estén en la misma red WiFi
- ✅ Verifica que el firewall de Windows permita el puerto 3002
- ✅ Verifica que el core-api esté corriendo en `http://localhost:3002`
- ✅ Prueba acceder desde el navegador del dispositivo a `http://TU_IP:3002/api/ping`

### Error: "CORS aún falla"
- ✅ Verifica que el middleware de CORS esté aplicado (debería estar con los cambios que hice)
- ✅ Verifica que el origin sea `https://localhost` (Capacitor)
- ✅ Revisa los logs del core-api para ver qué origin está recibiendo

### Error: "Puerto 3002 ocupado"
- Cambia el puerto en `packages/core-api/package.json` (script `dev`)
- O mata el proceso que está usando el puerto 3002:
  ```powershell
  netstat -ano | findstr :3002
  taskkill /PID <PID_NUMBER> /F
  ```

## ✅ Checklist

- [ ] IP local obtenida
- [ ] Core API corriendo en `http://localhost:3002`
- [ ] Firewall configurado para permitir puerto 3002
- [ ] Dispositivo y computadora en la misma red WiFi
- [ ] Acceso desde navegador del dispositivo funciona (`http://TU_IP:3002/api/ping`)
- [ ] `TEMP_LOCAL_API_URL` configurado en `src/lib/apiConfig.ts`
- [ ] APK recompilada
- [ ] Probado en dispositivo
- [ ] Cambios revertidos después de probar

