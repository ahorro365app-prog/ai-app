# 🔧 Solución: Dispositivo "unauthorized" en ADB

## ⚠️ Problema

Cuando ejecutas `adb devices`, ves:
```
List of devices attached
XOKZXO5LZDB6PFSK        unauthorized
```

Esto significa que el teléfono está conectado pero **no has aceptado el diálogo de depuración USB**.

## ✅ Solución Paso a Paso

### Paso 1: Verificar el Diálogo en el Teléfono

1. **Mira la pantalla de tu teléfono Android**
2. **Debería aparecer un diálogo** que dice:
   - "¿Permitir depuración USB?"
   - "¿Permitir depuración USB desde este equipo?"
   - "Allow USB debugging?"

### Paso 2: Aceptar y Marcar la Casilla

1. **Marca la casilla** (checkbox):
   - ☑ "Permitir siempre desde este equipo"
   - ☑ "Always allow from this computer"
   - Esto evita que tengas que aceptar cada vez

2. **Toca "Permitir"** o **"Allow"**

### Paso 3: Verificar

1. **Vuelve a PowerShell** en tu PC
2. **Ejecuta:**
   ```powershell
   adb devices
   ```
3. **Deberías ver:**
   ```
   List of devices attached
   XOKZXO5LZDB6PFSK        device
   ```
   - Si dice **"device"** (sin "unauthorized"), está listo ✅

---

## 🔄 Si el Diálogo NO Aparece

### Opción 1: Desconectar y Reconectar

1. **Desconecta el cable USB** del teléfono
2. **Espera 5 segundos**
3. **Vuelve a conectar** el cable
4. El diálogo debería aparecer

### Opción 2: Revocar Autorizaciones

1. En tu teléfono: **Configuración** → **Opciones de desarrollador**
2. Busca **"Revocar autorizaciones de depuración USB"**
3. **Toca** para revocar
4. **Desconecta y reconecta** el cable
5. El diálogo debería aparecer de nuevo

### Opción 3: Reiniciar ADB

En PowerShell:
```powershell
adb kill-server
adb start-server
adb devices
```

---

## ✅ Después de Autorizar

Una vez que `adb devices` muestre **"device"** (no "unauthorized"):

1. **Abre Chrome** en tu PC
2. **Ve a:** `chrome://inspect`
3. **Abre la app "Ahorro365"** en tu teléfono
4. **Haz clic en "inspect"** junto a tu app
5. **Ve a la pestaña "Console"** para ver los logs

---

## 💡 Tips

- **Mantén el teléfono desbloqueado** mientras haces debugging
- **No cierres el diálogo** sin aceptarlo
- Si el diálogo desaparece, **desconecta y reconecta** el cable
- Una vez marcada la casilla "siempre permitir", no volverás a ver el diálogo

---

## 🆘 Si Sigue Sin Funcionar

1. **Verifica que la depuración USB esté activada:**
   - Configuración → Opciones de desarrollador → Depuración USB (debe estar ON)

2. **Prueba otro cable USB:**
   - Algunos cables solo cargan, no transfieren datos

3. **Instala drivers USB:**
   - Busca en Google: "Android USB driver [marca de tu teléfono]"

4. **Prueba otro puerto USB:**
   - Algunos puertos USB 3.0 pueden tener problemas

