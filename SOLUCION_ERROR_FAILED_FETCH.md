# 🔧 Solución: Error "Failed to fetch" en localhost

**Fecha**: 2025-01-17  
**Error**: `Failed to fetch` en `/api/notifications/register-token`

---

## ❌ ¿Es Normal Este Error?

**NO**, este error NO es normal en localhost si el servidor está corriendo correctamente.

---

## 🔍 Causas Posibles

### 1. Servidor No Está Corriendo ⚠️ (Más Probable)

**Síntoma**: Error "Failed to fetch" al intentar hacer requests a la API

**Solución**:
```bash
# Iniciar el servidor de desarrollo
npm run dev
```

**Verificar**:
- El servidor debe estar corriendo en `http://localhost:3000`
- Debe ver mensajes como "Ready" en la consola

---

### 2. El Servidor Está en Otro Puerto

**Síntoma**: El servidor está corriendo pero en un puerto diferente

**Solución**:
- Verificar en qué puerto está corriendo el servidor
- Si está en otro puerto (ej: 3001), actualizar la URL en el código o usar el puerto correcto

---

### 3. Problema de CORS (Poco Probable en Localhost)

**Síntoma**: Error de CORS en la consola del navegador

**Solución**:
- En localhost, CORS no debería ser un problema
- Si aparece, verificar la configuración del servidor

---

### 4. El Middleware Está Bloqueando (Verificado - NO es el problema)

**Verificación**:
- ✅ El middleware excluye rutas API correctamente: `'/((?!api|_next/static|_next/image|favicon.ico).*)'`
- ✅ Las rutas `/api/*` NO son procesadas por el middleware
- ✅ El endpoint existe en `src/app/api/notifications/register-token/route.ts`

**Conclusión**: El middleware NO está bloqueando las rutas API.

---

## ✅ Verificaciones Realizadas

1. ✅ **Endpoint existe**: `src/app/api/notifications/register-token/route.ts`
2. ✅ **Middleware configurado correctamente**: Excluye rutas API
3. ✅ **Código del hook correcto**: Usa fetch estándar

---

## 🛠️ Pasos para Resolver

### Paso 1: Verificar que el Servidor Está Corriendo

```bash
# En la terminal, ejecutar:
npm run dev
```

**Debe mostrar**:
```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Ready in X seconds
```

### Paso 2: Verificar que el Endpoint Responde

Abrir en el navegador o usar curl:
```bash
# Probar el endpoint directamente
curl http://localhost:3000/api/notifications/register-token
```

**Debe retornar**:
- Si es GET: Error 405 (Method Not Allowed) - Esto es normal, el endpoint solo acepta POST
- Si es POST con datos válidos: Respuesta JSON

### Paso 3: Revisar la Consola del Servidor

Si el servidor está corriendo pero el error persiste:
1. Abrir la consola del servidor (terminal donde corre `npm run dev`)
2. Verificar si hay errores al hacer el request
3. Revisar logs de errores

### Paso 4: Verificar Variables de Entorno

Asegurar que las variables de entorno necesarias están configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 🎯 Solución Rápida

**Si el servidor NO está corriendo**:

1. Abrir una terminal
2. Navegar al directorio del proyecto
3. Ejecutar: `npm run dev`
4. Esperar a que el servidor esté listo
5. Recargar la página en el navegador

**Si el servidor SÍ está corriendo pero el error persiste**:

1. Verificar que estás accediendo a `http://localhost:3000`
2. Revisar la consola del navegador (F12) para más detalles del error
3. Revisar la consola del servidor para errores
4. Verificar que el endpoint existe y está accesible

---

## 📝 Notas

- Este error es común cuando el servidor no está corriendo
- En desarrollo, el servidor debe estar corriendo para que las APIs funcionen
- El middleware NO está causando este problema (está correctamente configurado)

---

**Última actualización**: 2025-01-17


