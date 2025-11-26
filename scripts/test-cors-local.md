# 🧪 Guía: Probar CORS Localmente

## Paso 1: Obtener tu IP Local

Ejecuta en PowerShell:
```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*'}).IPAddress | Select-Object -First 1
```

O busca manualmente:
- Abre PowerShell
- Ejecuta: `ipconfig`
- Busca "IPv4 Address" en la sección de tu adaptador de red (WiFi o Ethernet)
- Debería ser algo como: `192.168.1.XXX` o `10.0.0.XXX`

## Paso 2: Modificar Temporalmente el Código

### Opción A: Modificar directamente en el código (temporal)

**Archivo**: `src/app/profile/page.tsx` (línea ~392)

Cambiar temporalmente:
```typescript
// ANTES:
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ahorro365-core-api.vercel.app';

// DESPUÉS (temporal para testing):
const baseUrl = 'http://TU_IP_LOCAL:3002'; // Ejemplo: 'http://192.168.1.100:3002'
```

**Archivo**: `src/hooks/useRegisterFcmToken.ts` (línea ~356)

Cambiar temporalmente:
```typescript
// ANTES:
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ahorro365-core-api.vercel.app';

// DESPUÉS (temporal para testing):
const apiBaseUrl = 'http://TU_IP_LOCAL:3002'; // Ejemplo: 'http://192.168.1.100:3002'
```

### Opción B: Usar variable de entorno (recomendado)

Crear/editar `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_API_URL=http://TU_IP_LOCAL:3002
```

## Paso 3: Verificar que Core API esté Corriendo

1. Abre una terminal nueva
2. Ve a: `cd packages/core-api`
3. Ejecuta: `npm run dev`
4. Deberías ver: `Ready on http://localhost:3002`

## Paso 4: Verificar desde el Dispositivo

**IMPORTANTE**: Tu dispositivo Android y tu computadora deben estar en la **misma red WiFi**.

1. En tu dispositivo, verifica que esté conectado a la misma red WiFi que tu computadora
2. Prueba acceder desde el navegador del dispositivo a: `http://TU_IP_LOCAL:3002/api/ping`
3. Deberías ver una respuesta JSON

## Paso 5: Recompilar la APK

```bash
npm run build:apk
```

## Paso 6: Probar en el Dispositivo

1. Instala la nueva APK
2. Intenta desactivar notificaciones desde ajustes
3. Debería funcionar sin error de CORS

## Paso 7: Revertir Cambios (Después de Probar)

**IMPORTANTE**: Después de probar, revierte los cambios temporales:

1. Restaura el código original (o elimina la variable de entorno temporal)
2. Recompila la APK
3. Despliega los cambios de CORS a Vercel

## 🔍 Troubleshooting

### Error: "No se puede conectar"
- Verifica que el dispositivo y la computadora estén en la misma red WiFi
- Verifica que el firewall de Windows no esté bloqueando el puerto 3002
- Verifica que el core-api esté corriendo en `http://localhost:3002`

### Error: "CORS aún falla"
- Verifica que el middleware de CORS esté aplicado
- Verifica que el origin sea `https://localhost` (Capacitor)
- Revisa los logs del core-api para ver qué origin está recibiendo

### Error: "Puerto 3002 ocupado"
- Cambia el puerto en `packages/core-api/package.json` (script `dev`)
- O mata el proceso que está usando el puerto 3002

