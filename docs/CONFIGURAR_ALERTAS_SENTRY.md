# 📧 Configurar Alertas en Sentry

Esta guía explica cómo configurar alertas por email en Sentry para recibir notificaciones de errores críticos.

## 📋 Requisitos Previos

- ✅ Sentry ya está configurado en el proyecto
- ✅ Tienes acceso a la cuenta de Sentry
- ✅ Variables de entorno configuradas:
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_DSN`

## 🔧 Pasos para Configurar Alertas

### 1. Acceder a Sentry Dashboard

1. Ve a https://sentry.io
2. Inicia sesión en tu cuenta
3. Selecciona tu organización (`SENTRY_ORG`)
4. Selecciona tu proyecto (`SENTRY_PROJECT`)

### 2. Configurar Alertas para Errores Críticos

#### Opción A: Alertas desde Issues (Recomendado)

1. Ve a **Alerts** → **Create Alert Rule**
2. Selecciona **When an issue changes state from resolved to unresolved**
3. Configura:
   - **Conditions**: 
     - Issue state changes from `resolved` to `unresolved`
     - Issue level is `error` or `fatal`
   - **Actions**:
     - Send email to: [tu-email@ejemplo.com]
     - Notify in Slack (opcional)
4. Guarda la regla

#### Opción B: Alertas por Tasa de Errores

1. Ve a **Alerts** → **Create Alert Rule**
2. Selecciona **When the number of events in a project is...**
3. Configura:
   - **Conditions**:
     - Events in the last `15 minutes` is greater than `10`
     - Issue level is `error` or `fatal`
   - **Actions**:
     - Send email to: [tu-email@ejemplo.com]
4. Guarda la regla

### 3. Configurar Alertas para Rate Limit Excedido

1. Ve a **Alerts** → **Create Alert Rule**
2. Selecciona **When an issue matches...**
3. Configura:
   - **Conditions**:
     - Issue title contains `RATE_LIMIT_ERROR`
     - Issue level is `warning` or `error`
   - **Actions**:
     - Send email to: [tu-email@ejemplo.com]
4. Guarda la regla

### 4. Configurar Alertas para Errores de Autenticación

1. Ve a **Alerts** → **Create Alert Rule**
2. Selecciona **When an issue matches...**
3. Configura:
   - **Conditions**:
     - Issue title contains `AUTHENTICATION_ERROR` or `AUTHORIZATION_ERROR`
     - Issue level is `error`
   - **Actions**:
     - Send email a: [tu-email@ejemplo.com]
4. Guarda la regla

## 📊 Tipos de Alertas Recomendadas

### 🔴 Críticas (Configurar inmediatamente)

1. **Errores Fatal**: Cualquier error fatal
2. **Tasa de errores alta**: Más de 10 errores en 15 minutos
3. **Errores de base de datos**: Errores relacionados con Supabase
4. **Errores de autenticación**: Fallos en login o autorización

### 🟡 Importantes (Configurar en primera semana)

1. **Rate limit excedido**: Usuarios bloqueados por rate limiting
2. **Errores de validación**: Errores de validación de inputs
3. **Errores de API externa**: Fallos en llamadas a APIs externas (Groq, WhatsApp, etc.)

### 🟢 Opcionales (Configurar cuando crezcan)

1. **Errores de performance**: Requests que tardan más de 5 segundos
2. **Errores de file upload**: Fallos al subir archivos
3. **Errores de notificaciones**: Fallos en envío de notificaciones

## 🔔 Configuración de Notificaciones

### Email

1. Ve a **Settings** → **Notifications**
2. Configura:
   - **Email**: Tu email principal
   - **Frequency**: 
     - **Immediate**: Para errores críticos
     - **Daily digest**: Para resumen diario
   - **Projects**: Selecciona tu proyecto

### Slack (Opcional)

1. Ve a **Settings** → **Integrations** → **Slack**
2. Conecta tu workspace de Slack
3. Configura canales para diferentes tipos de alertas:
   - `#alerts-critical`: Errores críticos
   - `#alerts-important`: Errores importantes
   - `#alerts-info`: Resumen diario

## 📝 Verificación

Para verificar que las alertas funcionan:

1. **Test manual**: 
   - Genera un error de prueba en desarrollo
   - Verifica que recibes el email

2. **Monitoreo**:
   - Revisa el dashboard de Sentry regularmente
   - Ajusta las alertas según necesidad

## ⚙️ Configuración Avanzada

### Filtros de Alertas

Puedes agregar filtros para evitar spam:

- **Ignorar errores de desarrollo**: `environment != production`
- **Ignorar errores de bots**: `user.agent != bot`
- **Ignorar errores conocidos**: Agregar tags específicos

### Throttling

Configura throttling para evitar demasiados emails:

- **Máximo 1 email por hora** para el mismo error
- **Máximo 10 emails por día** por proyecto

## 📚 Recursos

- [Documentación oficial de Sentry Alerts](https://docs.sentry.io/product/alerts/)
- [Best Practices para Alertas](https://docs.sentry.io/product/alerts/alert-rules/best-practices/)

---

**Última actualización**: 2025-01-18


