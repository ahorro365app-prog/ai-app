# 🔍 Instrucciones Paso a Paso: Debugging Android App

## 📱 PASO 1: Habilitar USB Debugging en Android

### 1.1 Activar Modo Desarrollador
1. Abre **Configuración** en tu teléfono Android
2. Ve a **"Acerca del teléfono"** (About phone) o **"Acerca del dispositivo"**
3. Busca **"Número de compilación"** (Build number)
4. **Toca 7 veces seguidas** en "Número de compilación"
5. Verás un mensaje: **"Ahora eres desarrollador"** o **"You are now a developer"**

### 1.2 Activar Depuración USB
1. Vuelve a **Configuración**
2. Busca **"Opciones de desarrollador"** (Developer options)
   - Si no lo ves, busca en "Sistema" → "Opciones de desarrollador"
3. **Activa "Depuración USB"** (USB debugging)
   - Toca el switch para activarlo
4. Confirma si aparece un diálogo de advertencia

---

## 🔌 PASO 2: Conectar el Teléfono a la PC

### 2.1 Conectar con Cable USB
1. **Conecta tu teléfono Android a la PC** con un cable USB
2. En tu teléfono aparecerá un diálogo:
   - **"¿Permitir depuración USB?"**
   - **"¿Permitir depuración USB desde este equipo?"**
3. **Marca la casilla** "Permitir siempre desde este equipo" o "Always allow from this computer"
4. **Toca "Permitir"** o "Allow"

### 2.2 Verificar Conexión (PowerShell)
1. Abre **PowerShell** en tu PC
2. Ejecuta este comando:
   ```powershell
   adb devices
   ```
3. **Deberías ver algo como:**
   ```
   List of devices attached
   ABC123XYZ    device
   ```
   - Si ves "device", está conectado correctamente ✅
   - Si ves "unauthorized", acepta el diálogo en el teléfono
   - Si no aparece nada, revisa el cable o los drivers USB

---

## 🌐 PASO 3: Abrir Chrome DevTools

### 3.1 Abrir chrome://inspect
1. Abre **Google Chrome** en tu PC
2. En la **barra de direcciones** (arriba), escribe exactamente:
   ```
   chrome://inspect
   ```
3. **Presiona Enter**

### 3.2 Ver tu App
1. Deberías ver una sección llamada **"Remote Target"** o **"Dispositivos remotos"**
2. **Abre la app "Ahorro365"** en tu teléfono Android
   - La app debe estar **abierta y visible** en la pantalla
3. En Chrome, deberías ver tu dispositivo listado
4. Busca **"Ahorro365"** o **"com.ahorro365.app"** en la lista
5. Verás un botón **"inspect"** o **"inspeccionar"** al lado

---

## 🔍 PASO 4: Inspeccionar y Ver Logs

### 4.1 Abrir DevTools
1. **Haz clic en el botón "inspect"** (o "inspeccionar")
2. Se abrirá una **nueva ventana** de Chrome DevTools
   - Puede tardar unos segundos la primera vez

### 4.2 Ver la Consola
1. En la ventana de DevTools, busca la pestaña **"Console"** (Consola)
2. **Haz clic en "Console"**
3. Deberías ver logs como:
   ```
   🚀 Redirección desde index.html: {hasUser: false, targetPath: "/sign-in/", ...}
   ```
   - O cualquier error en **rojo**

### 4.3 Capturar los Logs
**Opción A: Copiar desde Consola**
1. **Haz clic derecho** en la consola
2. Selecciona **"Save as..."** (Guardar como)
3. O simplemente **selecciona todo** (Ctrl+A) y **copia** (Ctrl+C)

**Opción B: Captura de Pantalla**
1. Toma una **captura de pantalla** de la consola
2. O usa **"Print Screen"** y pega en Paint

---

## ⚠️ Si NO aparece tu app en chrome://inspect

### Solución 1: Verificar ADB
```powershell
# En PowerShell
adb devices
# Debería mostrar tu dispositivo
```

### Solución 2: Reiniciar ADB
```powershell
adb kill-server
adb start-server
adb devices
```

### Solución 3: Verificar que la app esté abierta
- La app **debe estar abierta y visible** en tu teléfono
- Luego **refresca** la página `chrome://inspect` en Chrome (F5)

### Solución 4: Verificar Drivers USB
- Si `adb devices` no muestra tu dispositivo, puede faltar el driver USB
- Busca en Google: "Android USB driver [marca de tu teléfono]"

---

## 🆘 Alternativa: Ver Logs con ADB (Sin Chrome DevTools)

Si Chrome DevTools no funciona, puedes ver los logs directamente:

### Ver todos los logs de la app:
```powershell
adb logcat | findstr "Ahorro365"
```

### Ver logs de JavaScript/WebView:
```powershell
adb logcat | findstr "chromium"
```

### Ver todos los logs (más información):
```powershell
adb logcat
```
- Presiona **Ctrl+C** para detener

---

## 📸 Qué Capturar

Si puedes, toma captura de pantalla o copia estos logs:

1. **Consola de Chrome DevTools:**
   - Todos los mensajes que aparezcan
   - Especialmente los que empiezan con:
     - `🚀 Redirección desde index.html`
     - `❌ Error`
     - `⚠️ Warning`

2. **Estado de la app:**
   - ¿Qué muestra la pantalla?
   - ¿Sigue diciendo "Redirigiendo..."?
   - ¿Hay algún error visible?

---

## 💡 Tips

- **Mantén el teléfono desbloqueado** mientras haces debugging
- **No cierres la app** mientras inspeccionas
- **Refresca `chrome://inspect`** si no aparece tu app
- Los logs aparecen en **tiempo real** mientras usas la app

---

## ✅ Checklist

- [ ] Modo desarrollador activado
- [ ] Depuración USB activada
- [ ] Teléfono conectado a PC
- [ ] `adb devices` muestra el dispositivo
- [ ] App abierta en el teléfono
- [ ] `chrome://inspect` muestra la app
- [ ] DevTools abierto
- [ ] Consola visible con logs

---

**Si después de seguir todos estos pasos no puedes ver los logs, avísame y buscaremos otra solución.**

