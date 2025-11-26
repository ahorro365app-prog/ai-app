# 🚨 GUÍA DE ALERTAS Y FUNCIONALIDADES DE SENTRY

**Para**: Ahorro365 App  
**Plan**: Sentry Free (5,000 eventos/mes)  
**Fecha**: 2025

---

## 📊 ALERTAS RECOMENDADAS PARA TU APP

### 1. **Alertas de Errores Críticos** ⚠️

#### A. Errores de API (500, 502, 503)
**Cuándo activar**: Cuando ocurran errores de servidor
- **Frecuencia**: Cada vez que ocurra un error 500+
- **Canales**: Email, Slack (si tienes), Dashboard
- **Impacto**: Alto - afecta la funcionalidad principal

**Configuración**:
```
Título: "Error de servidor detectado"
Condición: issue.category is error AND status.code >= 500
Frecuencia: Cada vez que ocurra
```

#### B. Errores de Autenticación
**Cuándo activar**: Errores relacionados con login/sesiones
- **Frecuencia**: Si hay más de 5 errores en 1 hora
- **Impacto**: Alto - usuarios no pueden acceder

**Configuración**:
```
Título: "Problemas de autenticación"
Condición: issue.message contains "authentication" OR "login" OR "session"
Frecuencia: Si hay más de 5 eventos en 1 hora
```

#### C. Errores de Pago/Transacciones
**Cuándo activar**: Cualquier error relacionado con pagos
- **Frecuencia**: Cada vez que ocurra
- **Impacto**: Crítico - afecta ingresos

**Configuración**:
```
Título: "Error en procesamiento de pago"
Condición: issue.message contains "payment" OR "transaction" OR "stripe" OR "groq"
Frecuencia: Cada vez que ocurra
```

#### D. Errores de Whisper (Transcripción de Audio)
**Cuándo activar**: Errores en la transcripción de voz
- **Frecuencia**: Si hay más de 3 errores en 1 hora
- **Impacto**: Medio - afecta funcionalidad de voz

**Configuración**:
```
Título: "Error en transcripción de audio"
Condición: issue.message contains "whisper" OR "transcription" OR "audio"
Frecuencia: Si hay más de 3 eventos en 1 hora
```

---

### 2. **Alertas de Rendimiento** 📈

#### A. Tiempo de Respuesta Lento
**Cuándo activar**: Cuando las APIs tarden más de 3 segundos
- **Frecuencia**: Si el 10% de las requests tardan > 3s en 5 minutos
- **Impacto**: Medio - afecta experiencia de usuario

**Configuración**:
```
Título: "Rendimiento degradado"
Condición: transaction.duration > 3000ms
Frecuencia: Si el 10% de transacciones exceden el umbral en 5 minutos
```

#### B. Errores de Memoria
**Cuándo activar**: Si hay problemas de memoria
- **Frecuencia**: Cada vez que ocurra
- **Impacto**: Alto - puede causar caídas

**Configuración**:
```
Título: "Problema de memoria detectado"
Condición: issue.message contains "memory" OR "out of memory"
Frecuencia: Cada vez que ocurra
```

---

### 3. **Alertas de Seguridad** 🔒

#### A. Intentos de Ataque
**Cuándo activar**: Errores que sugieren ataques
- **Frecuencia**: Si hay más de 10 errores en 10 minutos
- **Impacto**: Crítico - seguridad comprometida

**Configuración**:
```
Título: "Posible ataque detectado"
Condición: issue.message contains "SQL injection" OR "XSS" OR "CSRF" OR "unauthorized"
Frecuencia: Si hay más de 10 eventos en 10 minutos
```

#### B. Errores de Rate Limiting
**Cuándo activar**: Si hay muchos errores de rate limit
- **Frecuencia**: Si hay más de 50 errores en 1 hora
- **Impacto**: Medio - puede indicar abuso

**Configuración**:
```
Título: "Muchos errores de rate limiting"
Condición: issue.message contains "rate limit" OR "too many requests"
Frecuencia: Si hay más de 50 eventos en 1 hora
```

---

## 🎯 FUNCIONALIDADES ÚTILES PARA TU APP

### 1. **Release Tracking** 📦

**Qué es**: Rastrea qué versión de tu app causó cada error

**Cómo configurar**:
1. Ve a **Settings** → **Projects** → **[tu-proyecto]** → **Releases**
2. Agrega a tu `.env.local`:
   ```bash
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```
3. En cada deploy, actualiza la versión

**Beneficios**:
- Saber qué versión introdujo un bug
- Rollback más fácil
- Mejor debugging

---

### 2. **User Context** 👤

**Qué es**: Asocia errores con usuarios específicos

**Cómo implementar**:
```typescript
// En tu código, cuando un usuario inicia sesión
import * as Sentry from "@sentry/nextjs";

Sentry.setUser({
  id: user.id,
  email: user.email, // Opcional, solo si es necesario
  username: user.name,
});
```

**Beneficios**:
- Ver qué usuarios están afectados
- Contactar usuarios específicos si es necesario
- Entender patrones de uso

---

### 3. **Breadcrumbs** 🍞

**Qué es**: Rastrea las acciones del usuario antes de un error

**Ya está configurado** en `sentry.client.config.ts` con:
- Navegación
- Clicks
- Requests HTTP
- Console logs

**Beneficios**:
- Ver qué hizo el usuario antes del error
- Reproducir bugs más fácilmente
- Mejor contexto para debugging

---

### 4. **Performance Monitoring** ⚡

**Qué es**: Monitorea el rendimiento de tu app

**Ya está configurado** con:
- `tracesSampleRate: 0.1` (10% de requests en producción)
- Browser tracing habilitado

**Beneficios**:
- Identificar endpoints lentos
- Optimizar queries
- Mejorar experiencia de usuario

---

### 5. **Session Replay** 🎥

**Qué es**: Graba sesiones de usuarios cuando ocurren errores

**Ya está configurado** en `sentry.client.config.ts`:
```typescript
Sentry.replayIntegration({
  maskAllText: true, // Enmascarar datos sensibles
  blockAllMedia: true, // Bloquear media sensible
})
```

**Beneficios**:
- Ver exactamente qué hizo el usuario
- Reproducir bugs visualmente
- Entender mejor el contexto

**Nota**: Solo graba sesiones con errores (más eficiente)

---

### 6. **Custom Tags** 🏷️

**Qué es**: Etiquetas personalizadas para categorizar errores

**Cómo implementar**:
```typescript
import * as Sentry from "@sentry/nextjs";

// Agregar tags a errores específicos
Sentry.captureException(error, {
  tags: {
    feature: "voice-recording",
    user_plan: "premium",
    environment: "production",
  },
});
```

**Beneficios**:
- Filtrar errores por funcionalidad
- Ver qué features tienen más problemas
- Priorizar fixes

---

### 7. **Custom Context** 📝

**Qué es**: Agregar información adicional a los errores

**Cómo implementar**:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.setContext("transaction", {
  amount: 100,
  currency: "USD",
  payment_method: "stripe",
});

Sentry.captureException(error);
```

**Beneficios**:
- Más contexto sobre el error
- Debugging más rápido
- Mejor información para el equipo

---

## 🔧 CONFIGURACIÓN PASO A PASO

### Paso 1: Crear Alertas en Sentry

1. Ve a tu dashboard de Sentry
2. Haz clic en **"Alerts"** en el menú lateral
3. Haz clic en **"Create Alert Rule"**
4. Selecciona el tipo de alerta:
   - **Issue Alert**: Para errores específicos
   - **Metric Alert**: Para métricas de rendimiento
5. Configura las condiciones
6. Selecciona los canales de notificación (Email, Slack, etc.)
7. Guarda la alerta

### Paso 2: Configurar Notificaciones

1. Ve a **Settings** → **Notifications**
2. Agrega tu email (si no está)
3. Configura preferencias:
   - Frecuencia de emails
   - Qué tipos de alertas recibir
   - Horarios de notificación

### Paso 3: Configurar Integraciones (Opcional)

**Slack**:
1. Ve a **Settings** → **Integrations**
2. Busca **Slack**
3. Conecta tu workspace
4. Selecciona el canal para alertas

**Discord** (si usas):
1. Similar a Slack
2. Crea un webhook en Discord
3. Configúralo en Sentry

---

## 📋 CHECKLIST DE CONFIGURACIÓN

### Alertas Críticas (Hacer primero)
- [ ] Errores de servidor (500+)
- [ ] Errores de pago/transacciones
- [ ] Errores de autenticación

### Alertas Importantes
- [ ] Errores de Whisper/transcripción
- [ ] Rendimiento degradado
- [ ] Errores de memoria

### Funcionalidades
- [ ] Release tracking configurado
- [ ] User context implementado
- [ ] Custom tags para features principales
- [ ] Notificaciones por email configuradas

---

## 💡 MEJORES PRÁCTICAS

### 1. **No Crear Demasiadas Alertas**
- Empieza con 3-5 alertas críticas
- Agrega más según necesites
- Revisa y ajusta regularmente

### 2. **Usar Filtros Inteligentes**
- No alertar por errores conocidos/no críticos
- Usar condiciones específicas
- Evitar spam de notificaciones

### 3. **Revisar Alertas Regularmente**
- Revisa el dashboard diariamente
- Responde a alertas críticas inmediatamente
- Archiva errores resueltos

### 4. **Documentar Errores Comunes**
- Crea documentación interna
- Comparte con el equipo
- Mantén un registro de soluciones

---

## 🎯 ALERTAS ESPECÍFICAS PARA TU APP

Basado en las funcionalidades de tu app, estas son las alertas más importantes:

### 1. **Error en Procesamiento de Voz** 🎤
```
Título: "Error en grabación/procesamiento de voz"
Condición: issue.message contains "whisper" OR "voice" OR "recording" OR "audio"
Frecuencia: Si hay más de 3 eventos en 1 hora
Prioridad: Alta
```

### 2. **Error en Procesamiento con Groq** 🤖
```
Título: "Error en procesamiento con IA (Groq)"
Condición: issue.message contains "groq" OR "llm" OR "ai processing"
Frecuencia: Cada vez que ocurra
Prioridad: Crítica
```

### 3. **Error en WhatsApp Integration** 💬
```
Título: "Error en integración de WhatsApp"
Condición: issue.message contains "whatsapp" OR "baileys" OR "webhook"
Frecuencia: Si hay más de 5 eventos en 1 hora
Prioridad: Alta
```

### 4. **Error en Supabase** 🗄️
```
Título: "Error en base de datos (Supabase)"
Condición: issue.message contains "supabase" OR "database" OR "postgres"
Frecuencia: Cada vez que ocurra
Prioridad: Crítica
```

---

## 📊 MÉTRICAS A MONITOREAR

### Performance
- Tiempo de respuesta de APIs
- Tiempo de carga de páginas
- Tiempo de procesamiento de audio

### Errores
- Tasa de errores por endpoint
- Errores por usuario
- Errores por feature

### Uso
- Sesiones con errores
- Usuarios afectados
- Errores únicos vs repetidos

---

## 🚀 PRÓXIMOS PASOS

1. **Hoy**: Configura las 3-5 alertas críticas
2. **Esta semana**: Implementa user context y custom tags
3. **Este mes**: Revisa y optimiza alertas según uso real

---

**¿Necesitas ayuda configurando alguna alerta específica?** Avísame y te guío paso a paso.





