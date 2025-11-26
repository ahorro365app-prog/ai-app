# Configurar Alertas de Notificaciones (Webhooks)

Este documento explica cómo configurar las alertas automáticas del sistema de notificaciones usando webhooks de Discord o Slack.

## 📋 Requisitos

- Un servidor de Discord o Slack con permisos para crear webhooks
- Acceso a las variables de entorno del proyecto (Vercel, `.env.local`, etc.)

## 🔧 Configuración

### 1. Crear un Webhook en Discord

1. Ve a tu servidor de Discord
2. Configuración del servidor → Integraciones → Webhooks
3. Clic en "Nuevo Webhook"
4. Configura:
   - Nombre: `Notificaciones Ahorro365` (o el que prefieras)
   - Canal: Selecciona el canal donde quieres recibir las alertas
5. Clic en "Copiar URL del Webhook"
6. Guarda la URL (formato: `https://discord.com/api/webhooks/...`)

### 2. Crear un Webhook en Slack

1. Ve a tu workspace de Slack
2. Apps → Buscar "Incoming Webhooks"
3. Añadir a Slack → Seleccionar canal
4. Copiar la URL del webhook
5. Guarda la URL (formato: `https://hooks.slack.com/services/...`)

### 3. Configurar Variable de Entorno

Agrega la siguiente variable de entorno en tu proyecto:

**Nombre:** `NOTIFICATIONS_ALERT_WEBHOOK_URL`  
**Valor:** La URL del webhook que copiaste

#### En Vercel:
1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega `NOTIFICATIONS_ALERT_WEBHOOK_URL` con la URL del webhook
4. Selecciona los ambientes (Production, Preview, Development)
5. Guarda y redeploya

#### En `.env.local` (desarrollo):
```bash
NOTIFICATIONS_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## 🚨 Tipos de Alertas

El sistema envía alertas automáticamente cuando detecta:

1. **CRÍTICO: Cron Falló Completamente**
   - Se envía cuando `success: false` en la ejecución del cron
   - Incluye información de campañas y triggers procesados

2. **ADVERTENCIA: Ningún Trigger Procesado**
   - Se envía cuando `triggersProcessed === 0` pero `triggersTotal > 0`
   - Indica que los triggers se ejecutaron pero fallaron todos

3. **ADVERTENCIA: Cron No Ejecutado**
   - Se envía cuando el cron no se ha ejecutado en más de 30 minutos
   - Útil para detectar problemas con GitHub Actions o el endpoint

4. **CRÍTICO: Fallos Consecutivos**
   - Se envía cuando el cron falla en ejecuciones consecutivas
   - Indica un problema persistente que requiere atención inmediata

## 📊 Formato de las Alertas

Las alertas se envían en formato de embeds (Discord/Slack compatible) con:

- **Título:** Descripción del problema
- **Mensaje:** Detalles del problema
- **Color:** Según la severidad (azul=info, naranja=warning, rojo=error/crítico)
- **Campos:** Información adicional (campañas procesadas, triggers, etc.)
- **Timestamp:** Fecha y hora de la ejecución

## ✅ Verificar Configuración

1. Ejecuta el cron manualmente o espera a la próxima ejecución automática
2. Revisa el dashboard de monitoreo en `/notifications` del panel admin
3. Verifica que el estado de "Sistema de Alertas" muestre "Activo"
4. Si hay problemas, revisa los logs del servidor

## 🔍 Troubleshooting

### Las alertas no se envían

1. **Verifica la variable de entorno:**
   ```bash
   # En el servidor, verifica que existe
   echo $NOTIFICATIONS_ALERT_WEBHOOK_URL
   ```

2. **Verifica la URL del webhook:**
   - Asegúrate de que la URL sea válida
   - Prueba hacer un POST manual a la URL con curl:
     ```bash
     curl -X POST $NOTIFICATIONS_ALERT_WEBHOOK_URL \
       -H "Content-Type: application/json" \
       -d '{"embeds":[{"title":"Test","description":"Prueba de webhook"}]}'
     ```

3. **Revisa los logs:**
   - Busca mensajes como "Error enviando alerta a webhook" en los logs del servidor
   - Verifica que el endpoint del cron esté ejecutándose correctamente

### El dashboard muestra "Inactivo"

- Esto significa que `NOTIFICATIONS_ALERT_WEBHOOK_URL` no está configurado
- Configura la variable de entorno y recarga el dashboard

## 📝 Notas

- Las alertas no bloquean la ejecución del cron si fallan
- Los errores de envío de alertas se registran en los logs pero no afectan el funcionamiento del sistema
- El sistema compara el health check actual con el anterior para detectar problemas
- Las alertas se envían solo cuando se detectan problemas, no en cada ejecución exitosa

## 🔐 Seguridad

- **Nunca compartas la URL del webhook públicamente**
- La URL del webhook contiene credenciales de acceso
- Si la URL se compromete, revócala inmediatamente y crea una nueva
- Considera usar diferentes webhooks para diferentes ambientes (dev, staging, production)

