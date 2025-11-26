# 🛠️ FUNCIONALIDADES ESPECÍFICAS - DOCUMENTO MAESTRO

**Última actualización**: 2025-01-17 17:30:00 UTC  
**Versión**: 1.0  
**Este es el documento oficial y único de referencia para funcionalidades específicas**

> ⚠️ **IMPORTANTE**: Este es el único documento de funcionalidades específicas que debes consultar. Los demás documentos están obsoletos o son históricos.

---

## 📋 REGLAS DE USO Y ACTUALIZACIÓN

### 🔴 REGLAS OBLIGATORIAS

1. **SIEMPRE actualizar fecha y hora** al documentar funcionalidades
2. **SIEMPRE actualizar el historial de cambios** al modificar funcionalidades
3. **NO modificar este documento** sin seguir estas reglas

---

## 📊 ÍNDICE DE FUNCIONALIDADES

### 1. 📱 WhatsApp/QR Recovery
### 2. 🤖 Groq/Whisper Integration
### 3. 🎨 UI/UX (Swipe, Touch Events)
### 4. 💰 Sistema de Monedas
### 5. 🔍 Verificaciones y Análisis

---

## 1. 📱 WHATSAPP/QR RECOVERY

### Descripción
Sistema para recuperar conexión de Baileys cuando el panel muestra "Generando código QR..." o WhatsApp no permite vincular el dispositivo.

### Proceso de Recuperación

#### Paso 1: Verificar Visor de QR
- Visor: `https://ahorro365-baileys-worker.fly.dev/qr/view?t=NOW` (anti-caché)
- API cruda: `https://ahorro365-baileys-worker.fly.dev/qr`
- Si `qr` es `null` por más de 60s, pasar al paso 2

#### Paso 2: Reiniciar Worker
```bash
# Obtener Machine ID
flyctl machines list -a ahorro365-baileys-worker

# Reiniciar
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

#### Paso 3: Evitar Bucle EBUSY
Si se activó `FORCE_NEW_SESSION` y ves `EBUSY`:
```bash
flyctl secrets unset FORCE_NEW_SESSION -a ahorro365-baileys-worker
```

#### Paso 4: Limpieza de Credenciales
```bash
flyctl ssh console -a ahorro365-baileys-worker -C \
  "sh -lc 'rm -f /app/auth_info/*.json; ls -l /app/auth_info'"

flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

#### Paso 5: Escaneo Correcto
1. WhatsApp → Dispositivos vinculados → Cerrar sesión en todos
2. Vincular dispositivo → escanear QR
3. Si dice "No se pudo vincular", repetir proceso

### Archivos Relacionados
- Worker: `ahorro365-baileys-worker/`
- Endpoint QR: `/qr` y `/qr/view`

---

## 2. 🤖 GROQ/WHISPER INTEGRATION

### Descripción
Sistema de procesamiento de audio que usa Whisper para transcribir y Groq LLM para extraer información estructurada.

### Flujo Completo
```
Audio → Whisper (transcripción) → Groq LLM (extracción) → JSON estructurado
```

### Proceso

#### Paso 1: Usuario Graba Audio
- Por voz o archivo de audio
- Máximo 15 segundos

#### Paso 2: Whisper Transcribe
- Convierte audio a texto plano en español
- Endpoint: `/api/audio/process`

#### Paso 3: Groq Procesa
- Extrae: monto, categoría, tipo, descripción, fecha
- Retorna JSON estructurado

#### Paso 4: Se Guarda en BD
- Tabla `predicciones_groq` - Predicción de Groq
- Tabla `transacciones` - Transacción final

### Monedas Soportadas
- BOB (Boliviano)
- USD (Dólar)
- EUR (Euro)
- MXN (Peso mexicano)
- ARS (Peso argentino)
- CLP (Peso chileno)
- PEN (Sol peruano)
- COP (Peso colombiano)

### Categorías Disponibles
- comida, transporte, educacion, tecnologia, salud
- entretenimiento, servicios, ropa, otros
- Y categorías más específicas creadas dinámicamente

### Archivos Relacionados
- `src/app/api/audio/process/route.ts` - Endpoint principal
- `src/lib/groqService.ts` - Servicio de Groq
- Variables: `NEXT_PUBLIC_GROQ_API_KEY`

---

## 3. 🎨 UI/UX - SWIPE Y TOUCH EVENTS

### Swipe Threshold

#### Descripción
Umbral de distancia para detectar swipe en componentes móviles.

#### Configuración
- Threshold por defecto: 50px
- Configurable por componente
- Detecta swipe izquierda/derecha

#### Uso
```typescript
// En componentes con swipe
const SWIPE_THRESHOLD = 50; // px
```

### Touch Events Fix

#### Problema
Algunos eventos táctiles no se detectaban correctamente en móviles.

#### Solución
- Implementado manejo mejorado de touch events
- Soporte para touchstart, touchmove, touchend
- Prevención de scroll durante swipe

### Archivos Relacionados
- Componentes con swipe: Dashboard, History, etc.
- Hooks de touch events (si existen)

---

## 4. 💰 SISTEMA DE MONEDAS

### Descripción
Sistema que detecta automáticamente el país del usuario y muestra precios en su moneda local.

### Detección Automática
- **Geolocalización por IP**: Usa API de `ipapi.co`
- **Fallback por navegador**: Si falla, usa idioma del navegador
- **Almacenamiento local**: Guarda preferencia en `localStorage`

### Monedas Soportadas

#### América Latina
- ARS, BOB, BRL, CLP, COP, CRC, DOP, USD, GTQ, HNL
- MXN, NIO, PAB, PYG, PEN, UYU, VES

#### Otras Regiones
- USD, CAD, EUR, GBP

### Hook `useCurrency`

```typescript
import { useCurrency } from "@/hooks/useCurrency";

const { currency, formatAmount, isLoading } = useCurrency();
```

### Archivos Relacionados
- `src/hooks/useCurrency.ts` - Hook principal
- `src/lib/currencyUtils.ts` - Utilidades de moneda

---

## 5. 🔍 VERIFICACIONES Y ANÁLISIS

### Verificación de Límites de Input

#### Descripción
Sistema que verifica límites de tamaño y tiempo de procesamiento de inputs.

#### Límites Configurados
- Audio: Máximo 15 segundos
- Archivos: Máximo 5MB
- Texto: Máximo 5000 caracteres

### Análisis de Tiempo de Procesamiento

#### Métricas
- Tiempo de transcripción (Whisper)
- Tiempo de procesamiento (Groq)
- Tiempo total de request

### Estructura de Tablas Supabase

#### Tablas Clave
- `usuarios` - Información de usuarios
- `transacciones` - Transacciones financieras
- `referidos` - Sistema de referidos
- `codigos_verificacion` - Códigos de WhatsApp
- `fcm_tokens` - Tokens de notificaciones
- `notification_logs` - Historial de notificaciones

### Archivos Relacionados
- `docs/estructura-tablas-supabase.md` (obsoleto - ver este documento)
- `docs/verificacion-limites-input.md` (obsoleto - ver este documento)
- `docs/analisis-limites-tiempo-procesamiento.md` (obsoleto - ver este documento)

---

## 🔄 HISTORIAL DE CAMBIOS

### 2025-01-17 17:30:00 UTC - Versión 1.0
**Autor**: Sistema de consolidación  
**Cambios**:
- ✅ Consolidación completa de funcionalidades específicas
- ✅ Agregadas reglas de uso y actualización
- ✅ Organizadas por categoría (WhatsApp, Groq, UI/UX, Monedas, Verificaciones)
- ✅ Historial de cambios implementado

**Componentes afectados**: Todos (documentación)

---

## 📝 NOTAS IMPORTANTES

1. **Este es el único documento oficial** de funcionalidades específicas
2. **Los demás documentos** están obsoletos o son históricos
3. **Siempre actualizar fecha/hora** al documentar funcionalidades
4. **Referencias cruzadas** a otros documentos maestros cuando aplica

---

**Última actualización**: 2025-01-17 17:30:00 UTC  
**Próxima revisión programada**: 2025-02-17

