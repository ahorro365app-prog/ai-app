# 🚨 CONFIGURAR ALERTAS CRÍTICAS EN SENTRY - PASO A PASO

**Tiempo estimado**: 15 minutos  
**Dificultad**: Fácil  
**Resultado**: 5 alertas críticas configuradas

---

## 📋 ALERTAS QUE VAMOS A CONFIGURAR

1. ✅ Errores de servidor (500+)
2. ✅ Errores de pago/transacciones
3. ✅ Errores de autenticación
4. ✅ Errores de Whisper (transcripción)
5. ✅ Errores de Groq (IA)

---

## 🚀 PASO 1: ACCEDER A ALERTAS

1. Ve a **https://sentry.io**
2. Inicia sesión
3. Selecciona tu proyecto **"ahorro-365"** (o el nombre que le diste)
4. En el menú lateral izquierdo, haz clic en **"Alerts"** (o "Alertas" si está en español)
5. Haz clic en el botón **"Create Alert Rule"** (o "Crear regla de alerta")

---

## 🚨 ALERTA 1: ERRORES DE SERVIDOR (500+)

### Configuración

1. **Tipo de alerta**: Selecciona **"Issue Alert"**

2. **Nombre de la alerta**:
   ```
   Error de servidor (500+)
   ```

3. **Condiciones** (If):
   - **Primera condición**:
     - Campo: `issue.category`
     - Operador: `is equal to`
     - Valor: `error`
   - **Segunda condición** (haz clic en "Add condition"):
     - Campo: `status.code`
     - Operador: `is greater than or equal to`
     - Valor: `500`

4. **Actions** (Acciones):
   - Haz clic en **"Add action"**
   - Selecciona **"Send a notification"**
   - Selecciona **"Email"**
   - Ingresa tu email
   - Frecuencia: **"Each time the conditions are met"** (Cada vez que se cumplan las condiciones)

5. **Guardar**: Haz clic en **"Save Rule"** o **"Guardar regla"**

---

## 💳 ALERTA 2: ERRORES DE PAGO/TRANSACCIONES

### Configuración

1. **Tipo de alerta**: **"Issue Alert"**

2. **Nombre de la alerta**:
   ```
   Error en procesamiento de pago
   ```

3. **Condiciones** (If):
   - **Primera condición**:
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `payment`
   - **Segunda condición** (OR - haz clic en "OR"):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `transaction`
   - **Tercera condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `stripe`
   - **Cuarta condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `groq` (si procesas pagos con Groq)

4. **Actions**:
   - **"Send a notification"** → **"Email"** → Tu email
   - Frecuencia: **"Each time the conditions are met"**

5. **Guardar**

---

## 🔐 ALERTA 3: ERRORES DE AUTENTICACIÓN

### Configuración

1. **Tipo de alerta**: **"Issue Alert"**

2. **Nombre de la alerta**:
   ```
   Problemas de autenticación
   ```

3. **Condiciones** (If):
   - **Primera condición**:
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `authentication`
   - **Segunda condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `login`
   - **Tercera condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `session`
   - **Cuarta condición** (AND - cambia a AND):
     - Campo: `events`
     - Operador: `is greater than`
     - Valor: `5`
   - **Quinta condición** (AND):
     - Campo: `time window`
     - Operador: `in the last`
     - Valor: `1 hour`

4. **Actions**:
   - **"Send a notification"** → **"Email"** → Tu email
   - Frecuencia: **"Each time the conditions are met"**

5. **Guardar**

---

## 🎤 ALERTA 4: ERRORES DE WHISPER (TRANSCRIPCIÓN)

### Configuración

1. **Tipo de alerta**: **"Issue Alert"**

2. **Nombre de la alerta**:
   ```
   Error en transcripción de audio (Whisper)
   ```

3. **Condiciones** (If):
   - **Primera condición**:
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `whisper`
   - **Segunda condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `transcription`
   - **Tercera condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `audio`
   - **Cuarta condición** (AND):
     - Campo: `events`
     - Operador: `is greater than`
     - Valor: `3`
   - **Quinta condición** (AND):
     - Campo: `time window`
     - Operador: `in the last`
     - Valor: `1 hour`

4. **Actions**:
   - **"Send a notification"** → **"Email"** → Tu email
   - Frecuencia: **"Each time the conditions are met"**

5. **Guardar**

---

## 🤖 ALERTA 5: ERRORES DE GROQ (IA)

### Configuración

1. **Tipo de alerta**: **"Issue Alert"**

2. **Nombre de la alerta**:
   ```
   Error en procesamiento con IA (Groq)
   ```

3. **Condiciones** (If):
   - **Primera condición**:
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `groq`
   - **Segunda condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `llm`
   - **Tercera condición** (OR):
     - Campo: `issue.message`
     - Operador: `contains`
     - Valor: `ai processing`

4. **Actions**:
   - **"Send a notification"** → **"Email"** → Tu email
   - Frecuencia: **"Each time the conditions are met"**

5. **Guardar**

---

## ✅ VERIFICACIÓN

Después de crear las 5 alertas:

1. Ve a **"Alerts"** en el menú lateral
2. Deberías ver las 5 alertas listadas
3. Cada alerta debe mostrar:
   - ✅ Nombre
   - ✅ Condiciones
   - ✅ Acciones (Email configurado)
   - ✅ Estado: **"Active"** o **"Activa"**

---

## 🧪 PROBAR LAS ALERTAS

### Probar Alerta de Groq

1. Ve a `/test-sentry` en tu app
2. Haz clic en **"🔵 Generar Error de API"**
3. Espera 10-30 segundos
4. Deberías recibir un email de Sentry con la alerta

### Probar Alerta de Servidor

1. En `/test-sentry`, haz clic en **"🔴 Generar Error Síncrono"**
2. Espera 10-30 segundos
3. Deberías recibir un email

**Nota**: Las alertas pueden tardar unos minutos en activarse después de crearlas.

---

## 📧 CONFIGURAR NOTIFICACIONES POR EMAIL

Si no has configurado tu email en Sentry:

1. Ve a **Settings** (⚙️) en el menú superior
2. Haz clic en **"Notifications"** en el menú lateral
3. En **"Email"**, agrega tu email
4. Verifica tu email (revisa tu bandeja de entrada)
5. Configura tus preferencias:
   - **Frequency**: "Always" (Siempre)
   - **Alerts**: Marca todas las casillas
   - **Workflow**: Marca "Only for issues I subscribe to" o "All issues"

---

## 🎯 CONFIGURACIÓN AVANZADA (Opcional)

### Agregar más canales de notificación

**Slack** (si usas):
1. Ve a **Settings** → **Integrations**
2. Busca **"Slack"**
3. Conecta tu workspace
4. Selecciona el canal para alertas
5. En cada alerta, agrega **"Send to Slack"** como acción adicional

**Discord** (si usas):
1. Similar a Slack
2. Crea un webhook en Discord
3. Configúralo en Sentry

---

## 📊 RESUMEN DE ALERTAS CONFIGURADAS

| # | Alerta | Frecuencia | Prioridad |
|---|--------|------------|-----------|
| 1 | Errores de servidor (500+) | Cada vez | 🔴 Crítica |
| 2 | Errores de pago | Cada vez | 🔴 Crítica |
| 3 | Errores de autenticación | >5 en 1h | 🟠 Alta |
| 4 | Errores de Whisper | >3 en 1h | 🟠 Alta |
| 5 | Errores de Groq | Cada vez | 🔴 Crítica |

---

## ⚠️ CONSEJOS

1. **No crear demasiadas alertas**: Empieza con estas 5, agrega más según necesites
2. **Revisar regularmente**: Revisa el dashboard de Sentry diariamente
3. **Ajustar umbrales**: Si recibes demasiados emails, aumenta los umbrales (ej: de 3 a 5 errores)
4. **Archivar errores resueltos**: Mantén el dashboard limpio

---

## 🆘 SI ALGO NO FUNCIONA

### No recibo emails
- Verifica que tu email esté verificado en Sentry
- Revisa la carpeta de spam
- Verifica que las alertas estén "Active"

### No encuentro las opciones
- Asegúrate de estar en el proyecto correcto
- Verifica que tengas permisos de administrador
- Intenta refrescar la página

### Las alertas no se activan
- Espera unos minutos después de crearlas
- Verifica que las condiciones sean correctas
- Prueba generando un error manualmente

---

**¿Necesitas ayuda con algún paso específico?** Avísame y te guío.





