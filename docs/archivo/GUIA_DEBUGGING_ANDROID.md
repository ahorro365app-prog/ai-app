# 🔍 Guía: Debugging Android App con Chrome DevTools

## 📱 Paso 1: Habilitar USB Debugging en tu Android

1. **Ve a Configuración** en tu teléfono Android
2. **Busca "Acerca del teléfono"** (About phone)
3. **Toca 7 veces en "Número de compilación"** (Build number)
   - Verás un mensaje: "Ahora eres desarrollador"
4. **Vuelve a Configuración**
5. **Busca "Opciones de desarrollador"** (Developer options)
6. **Activa "Depuración USB"** (USB debugging)
   - Confirma si aparece un diálogo

## 🔌 Paso 2: Conectar el Teléfono a la PC

1. **Conecta tu teléfono Android a la PC** con un cable USB
2. **En tu teléfono**, aparecerá un diálogo:
   - "¿Permitir depuración USB?"
   - **Marca la casilla "Permitir siempre desde este equipo"**
   - **Toca "Permitir"**
3. **Verifica la conexión:**
   - Abre PowerShell en tu PC
   - Ejecuta: `adb devices`
   - Deberías ver tu dispositivo listado

## 🌐 Paso 3: Abrir Chrome DevTools

1. **Abre Google Chrome** en tu PC
2. **En la barra de direcciones**, escribe: `chrome://inspect`
3. **Presiona Enter**
4. **Deberías ver:**
   - Una sección "Remote Target"
   - Tu dispositivo Android listado
   - Tu app "Ahorro365" con un botón "inspect"

## 🔍 Paso 4: Inspeccionar la App

1. **Busca tu app** en la lista (debería decir "Ahorro365" o "com.ahorro365.app")
2. **Haz clic en el botón "inspect"** (o "inspeccionar")
3. **Se abrirá una nueva ventana** de Chrome DevTools
4. **Ve a la pestaña "Console"** (Consola)
5. **Deberías ver los logs:**
   - `🔍 Redirección: {...}`
   - `📱 Usando window.location.replace (Capacitor)` o `🌐 Usando router.push (Web)`
   - Cualquier error en rojo

## 📋 Paso 5: Capturar los Logs

1. **Haz clic derecho en la consola**
2. **Selecciona "Save as..."** (Guardar como)
3. **O simplemente copia y pega** los mensajes que veas

## ⚠️ Si no aparece tu app en chrome://inspect

### Opción A: Verificar ADB
```powershell
# En PowerShell
adb devices
# Debería mostrar tu dispositivo
```

### Opción B: Reiniciar ADB
```powershell
adb kill-server
adb start-server
adb devices
```

### Opción C: Verificar que la app esté abierta
- Asegúrate de que la app "Ahorro365" esté **abierta y visible** en tu teléfono
- Luego refresca `chrome://inspect` en Chrome

---

## 🆘 Alternativa: Ver Logs con ADB

Si Chrome DevTools no funciona, puedes ver los logs directamente:

```powershell
# Ver todos los logs de la app
adb logcat | findstr "Ahorro365"

# O ver todos los logs de JavaScript/WebView
adb logcat | findstr "chromium"
```

---

## 📸 Captura de Pantalla

Si puedes, toma una captura de pantalla de:
1. La consola de Chrome DevTools
2. Los logs que aparezcan
3. Cualquier error en rojo

Esto me ayudará a diagnosticar el problema más rápido.

