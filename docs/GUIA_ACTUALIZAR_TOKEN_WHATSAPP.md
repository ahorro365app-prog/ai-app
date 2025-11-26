# 📝 Guía: Cómo Actualizar el Token de WhatsApp Correctamente

> **Última actualización:** 2025-11-22  
> **Versión:** 1.0  
> **Problema común:** Token aparece como inválido después de actualizarlo manualmente

---

## ⚠️ Problema Común

Actualizas el token en `.env.local` manualmente, pero el servidor dice que está inválido o expirado, aunque el token es nuevo y válido.

**Causas más comunes:**
1. ❌ Espacios antes o después del `=`
2. ❌ Comillas alrededor del token
3. ❌ Saltos de línea en medio del token
4. ❌ No reiniciar el servidor después de actualizar
5. ❌ Caracteres invisibles o encoding incorrecto

---

## ✅ Solución Paso a Paso

### Paso 1: Abrir el Archivo Correcto

**Ubicación:** `packages/core-api/.env.local`

**Importante:** Debe estar en la carpeta `packages/core-api/`, NO en la raíz del proyecto.

---

### Paso 2: Buscar la Línea del Token

Busca esta línea:
```
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB...
```

---

### Paso 3: Formato CORRECTO

**✅ FORMATO CORRECTO:**
```
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkABQMaKIdLGIoL0V2J5TZAXyyxp8IfzcVHZBHYiMjJNeNsZC2ZCOJaIyKskv4d68y2LoDPYUy1SV4NoV7EanNPG47CKcjZAZBZC9KQri0KVgOs0rx0IZB92e51JZArgx9XPZBrtdHIBFHJcUwM5zmykvKVADJI34PLBuibzJMqtDqTMS2JGW5l1z14qLItxN7SAbYNpAbGmepz7NNHFShFNVe6CrZBLEvgVQwfXZA7MTRb3trgPzfrZCmpDJ63NupEchPEcZBkAdanHoTa1z0T0CT
```

**Reglas:**
- ✅ Sin espacios antes del `=`
- ✅ Sin espacios después del `=`
- ✅ Sin comillas (`"` o `'`)
- ✅ En una sola línea (sin saltos de línea)
- ✅ Sin espacios al inicio o final del token

---

### Paso 4: Errores Comunes

**❌ INCORRECTO (con espacios):**
```
WHATSAPP_ACCESS_TOKEN = EAAdQZBR1AjkAB...
```
❌ Tiene espacios antes y después del `=`

**❌ INCORRECTO (con comillas):**
```
WHATSAPP_ACCESS_TOKEN="EAAdQZBR1AjkAB..."
```
❌ Tiene comillas alrededor del token

**❌ INCORRECTO (con saltos de línea):**
```
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB
QMaKIdLGIoL0V2J5TZAXyyxp8IfzcVHZBHYiMjJNeNsZC2ZCOJaIyKskv4d68y2LoDPYUy1SV4NoV7EanNPG47CKcjZAZBZC9KQri0KVgOs0rx0IZB92e51JZArgx9XPZBrtdHIBFHJcUwM5zmykvKVADJI34PLBuibzJMqtDqTMS2JGW5l1z14qLItxN7SAbYNpAbGmepz7NNHFShFNVe6CrZBLEvgVQwfXZA7MTRb3trgPzfrZCmpDJ63NupEchPEcZBkAdanHoTa1z0T0CT
```
❌ Tiene un salto de línea en medio del token

**❌ INCORRECTO (con espacios al inicio/final):**
```
WHATSAPP_ACCESS_TOKEN= EAAdQZBR1AjkAB... 
```
❌ Tiene espacio después del `=` y al final

---

### Paso 5: Cómo Editar Correctamente

**Método 1: Reemplazar Todo (Recomendado)**

1. Selecciona TODO el token viejo (desde `EA` hasta el final)
2. Elimina (Delete o Backspace)
3. Pega el token nuevo (Ctrl+V)
4. Verifica que no hay espacios ni comillas
5. Guarda (Ctrl+S)

**Método 2: Reemplazar Línea Completa**

1. Selecciona toda la línea: `WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB...`
2. Elimina
3. Escribe: `WHATSAPP_ACCESS_TOKEN=`
4. Pega el token nuevo (sin espacios)
5. Verifica que está en una sola línea
6. Guarda (Ctrl+S)

---

### Paso 6: Verificar el Formato

Después de guardar, verifica:

1. **Sin espacios:** La línea debe ser exactamente:
   ```
   WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB...
   ```
   (Sin espacios antes o después del `=`)

2. **Sin comillas:** No debe tener `"` o `'` alrededor del token

3. **Una sola línea:** El token completo debe estar en una sola línea

4. **Longitud:** El token debe tener ~200-300 caracteres

---

### Paso 7: Reiniciar el Servidor

**⚠️ CRÍTICO:** Debes reiniciar el servidor para que cargue el nuevo token.

1. En la terminal donde corre `npm run dev`:
   - Presiona `Ctrl+C`
   - Espera a que se detenga completamente (verás el prompt `PS C:\...>`)

2. Ejecuta:
   ```powershell
   cd packages/core-api
   npm run dev
   ```

3. Espera a que inicie completamente (verás `✓ Ready in X.Xs`)

---

### Paso 8: Verificar que Funciona

Después de reiniciar, prueba:

```powershell
Invoke-WebRequest -Uri "http://localhost:3002/api/whatsapp/test-token" -Method GET
```

**Debería mostrar:**
```json
{
  "success": true,
  "message": "Token válido",
  "data": {
    "phoneNumberId": "840593392476984",
    "verifiedName": "Ahorro 365 Asistente"
  }
}
```

---

## 🔍 Troubleshooting

### Problema: Token sigue apareciendo como inválido

**Solución:**
1. Verifica que no hay espacios antes o después del `=`
2. Verifica que no hay comillas
3. Verifica que el token está en una sola línea
4. **Reinicia el servidor** (esto es crítico)
5. Verifica que el token tiene ~200-300 caracteres

---

### Problema: "Token no configurado"

**Solución:**
1. Verifica que el archivo está en `packages/core-api/.env.local`
2. Verifica que la línea es exactamente: `WHATSAPP_ACCESS_TOKEN=...`
3. Verifica que no hay espacios antes de `WHATSAPP_ACCESS_TOKEN`
4. Reinicia el servidor

---

### Problema: Token funciona cuando lo actualizo yo pero no cuando lo haces tú

**Causa común:**
- Espacios invisibles
- Comillas que no ves
- Saltos de línea ocultos
- Encoding incorrecto del archivo

**Solución:**
1. Elimina toda la línea del token
2. Escribe manualmente: `WHATSAPP_ACCESS_TOKEN=`
3. Pega el token (Ctrl+V)
4. Verifica que no hay espacios
5. Guarda el archivo
6. Reinicia el servidor

---

## 📋 Checklist Rápido

Antes de decir que el token no funciona, verifica:

- [ ] El token está en `packages/core-api/.env.local`
- [ ] La línea es: `WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB...` (sin espacios)
- [ ] No hay comillas alrededor del token
- [ ] El token está en una sola línea (sin saltos de línea)
- [ ] El token tiene ~200-300 caracteres
- [ ] El token comienza con `EA`
- [ ] **Reiniciaste el servidor después de actualizar**
- [ ] El servidor inició correctamente

---

## 💡 Tips

### Usar un Editor de Texto Simple

Si tu editor (VS Code, etc.) está causando problemas, usa el Bloc de Notas de Windows:

1. Abre Bloc de Notas
2. Abre `packages/core-api/.env.local`
3. Busca `WHATSAPP_ACCESS_TOKEN=`
4. Reemplaza el token
5. Guarda (Ctrl+S)
6. Cierra Bloc de Notas

### Verificar con PowerShell

Puedes verificar el formato con PowerShell:

```powershell
cd packages/core-api
$line = Get-Content .env.local | Select-String "WHATSAPP_ACCESS_TOKEN="
$token = $line -replace "WHATSAPP_ACCESS_TOKEN=", ""
Write-Host "Longitud: $($token.Length)"
Write-Host "Tiene espacios: $($token -match '\s')"
Write-Host "Tiene comillas: $($token -match '["'']')"
```

---

## 🎯 Resumen

**Formato correcto:**
```
WHATSAPP_ACCESS_TOKEN=EAAdQZBR1AjkAB... (token completo en una línea)
```

**Después de actualizar:**
1. ✅ Guarda el archivo
2. ✅ Reinicia el servidor (Ctrl+C y npm run dev)
3. ✅ Verifica con el endpoint de prueba

---

**Documento creado:** 2025-11-22  
**Última actualización:** 2025-11-22  
**Versión:** 1.0
