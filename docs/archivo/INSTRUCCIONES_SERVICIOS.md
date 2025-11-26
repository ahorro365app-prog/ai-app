# 🚀 Instrucciones de Servicios - Ahorro365

## ✅ Servicios Actualmente Activos

### 1. App Principal
- **URL:** http://localhost:3002
- **Estado:** ✅ Corriendo (PID: 4092)
- **Descripción:** Aplicación principal de Ahorro365

### 2. Admin Dashboard  
- **URL:** http://localhost:3001
- **Estado:** ✅ Corriendo (PID: 24160)
- **Descripción:** Panel de control administrativo

### 3. Baileys Worker
- **URL:** http://localhost:3004
- **Estado:** ✅ Corriendo (PID: 29016)
- **Descripción:** Worker de WhatsApp
- **Endpoints:**
  - Health: http://localhost:3004/health
  - Status: http://localhost:3004/status
  - QR: http://localhost:3004/qr

---

## 🔧 Mejoras Realizadas

### 1. **Manejo de Reconexión de WhatsApp**
- ✅ Lógica de reconexión mejorada con límites
- ✅ Detección de sesiones inválidas
- ✅ Automatización de reconexión (máximo 5 intentos)
- ✅ Delay entre reconexiones (5 segundos)

### 2. **Corrección del Botón Desconectar**
- ✅ El botón "Desconectar" ahora se deshabilita cuando el estado es "Desconectado"
- ✅ Solo se puede desconectar cuando realmente está conectado

### 3. **Configuración del Baileys Worker**
- ✅ Archivo `.env` creado con configuración correcta
- ✅ Puerto configurado: 3003
- ✅ Variables de entorno configuradas

### 4. **Corrección de Lógica de QR**
- ✅ Endpoint `/qr` ahora muestra correctamente el estado de conexión
- ✅ Sincronización entre estado de conexión y disponibilidad de QR

---

## 📱 Para Ver el Código QR de WhatsApp

El Baileys Worker está corriendo pero el QR no se está generando automáticamente. Para ver y diagnosticar el problema:

### Opción 1: Ver logs en tiempo real
Abre una nueva terminal PowerShell y ejecuta:

```powershell
cd C:\Users\Usuario\ai-app\ahorro365-baileys-worker
npm run dev
```

Esto mostrará los logs del worker y verás:
- Si el QR se está generando
- Si hay errores de conexión
- El estado de la conexión de WhatsApp

### Opción 2: Revisar el Admin Dashboard
Ve a: http://localhost:3001/whatsapp-status

El dashboard mostrará el QR si está disponible o un mensaje de carga mientras intenta generar uno.

---

## 🔄 Reiniciar los Servicios

Si necesitas reiniciar todos los servicios:

### Detener todos los servicios
```powershell
# Detener cada servicio por PID
Stop-Process -Id 4092 -Force   # App Principal
Stop-Process -Id 24160 -Force  # Admin Dashboard
Stop-Process -Id 16632 -Force  # Baileys Worker
```

### Reiniciar cada servicio
```powershell
# App Principal (puerto 3002)
cd C:\Users\Usuario\ai-app
npm run dev

# Admin Dashboard (puerto 3001)
cd C:\Users\Usuario\ai-app\admin-dashboard
npm run dev

# Baileys Worker (puerto 3003)
cd C:\Users\Usuario\ai-app\ahorro365-baileys-worker
npm run dev
```

---

## 🐛 Solución de Problemas

### El QR no se genera
1. Verifica que el archivo `.env` existe en `ahorro365-baileys-worker/` con `PORT=3004`
2. Ejecuta el worker en una terminal visible para ver los logs
3. Verifica que no hay archivos en `ahorro365-baileys-worker/auth_info/` (borrarlos si existen)
4. Reinicia el worker
5. Asegúrate de que el puerto 3004 no esté en uso

### El botón "Desconectar" está activo cuando está desconectado
- ✅ Esto ya fue corregido. Recarga la página del Admin Dashboard.

### Error "EADDRINUSE"
Significa que el puerto ya está en uso.
- Busca el proceso con: `netstat -ano | findstr "PUERTO"`
- Detén el proceso con: `Stop-Process -Id PID -Force`

---

## 📝 Configuración de Variables de Entorno

El archivo `.env` del Baileys Worker contiene:

```env
WHATSAPP_NUMBER=59160360908
BACKEND_URL=http://localhost:3002
ADMIN_DASHBOARD_URL=http://localhost:3001
PORT=3004
BACKEND_API_KEY=
```

---

## ✅ Estado Actual

- [x] Mejoras en reconexión de WhatsApp
- [x] Corrección del botón Desconectar
- [x] Configuración de puertos
- [x] Archivo .env creado
- [x] Todos los servicios corriendo
- [ ] **Pendiente:** Ver logs del worker para diagnosticar generación de QR

---

**Última actualización:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

