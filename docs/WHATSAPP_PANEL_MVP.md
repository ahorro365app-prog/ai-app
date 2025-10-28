# WhatsApp Status Panel - MVP

## 📋 Resumen

Panel de monitoreo en tiempo real del servicio Baileys Worker para WhatsApp.

## 🎯 Funcionalidades

### 1. Estado de Conexión
- Estado actual (conectado/desconectado)
- Uptime percentage
- Número de WhatsApp
- Última sincronización
- Botón de reconexión

### 2. Métricas del Día
- Audios procesados
- Tasa de éxito (%)
- Errores
- Transacciones creadas
- Monto total procesado

### 3. Eventos en Tiempo Real
- Log de últimos 20 eventos
- Tipo de evento
- Estado (success/error)
- Mensaje descriptivo
- Timestamp

## 🗄️ Base de Datos

### Tablas creadas (Supabase)

```sql
-- Ejecutar: create-whatsapp-panel-tables.sql

1. whatsapp_session
   - Estado de conexión
   - Última sincronización
   - Uptime

2. whatsapp_metrics
   - Métricas diarias
   - Audios, éxitos, errores
   - Transacciones y montos

3. whatsapp_events
   - Log de eventos
   - Tipo y estado
   - Detalles JSONB
```

## 🔌 API Endpoints

### GET /api/whatsapp/status
Obtiene estado de la sesión de WhatsApp

**Response:**
```json
{
  "status": "connected",
  "uptime": 99.8,
  "number": "+59170000000",
  "lastSync": "2024-12-20T10:30:00Z",
  "jid": "59170000000@s.whatsapp.net"
}
```

### POST /api/whatsapp/status
Reconecta la sesión de WhatsApp

**Body:**
```json
{
  "action": "reconnect"
}
```

### GET /api/whatsapp/metrics
Obtiene métricas del día actual

**Response:**
```json
{
  "audios": 245,
  "successRate": 98,
  "errors": 5,
  "transactions": 240,
  "totalAmount": 12450.50
}
```

### GET /api/whatsapp/events?limit=20
Obtiene últimos eventos

**Response:**
```json
[
  {
    "id": "uuid",
    "timestamp": "2024-12-20T10:30:00Z",
    "type": "audio_received",
    "phone": "+59170000001",
    "status": "success",
    "message": "Audio transcrito correctamente",
    "details": {}
  }
]
```

## 🎨 Componentes

### StatusCard
- Muestra estado de conexión
- Uptime percentage
- Botón de reconexión
- Auto-refresh cada 30s

### MetricsCard
- Grid con 5 métricas
- Cards coloridos por tipo
- Auto-refresh cada 30s

### EventsLog
- Lista de últimos eventos
- Iconos de estado
- Auto-scroll
- Auto-refresh cada 15s

## 🚀 Instalación

### 1. Ejecutar SQL en Supabase
```bash
# Ejecutar create-whatsapp-panel-tables.sql en SQL Editor
```

### 2. Verificar variables de entorno
```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Acceder al panel
```
http://localhost:3000/whatsapp-status
```

## 🔄 Integración con Baileys Worker

### Enviar métricas

```typescript
// En Baileys Worker
import axios from 'axios';

async function sendMetrics() {
  const metrics = {
    audios_count: 245,
    success_count: 243,
    error_count: 2,
    transactions_count: 243,
    total_amount: 12450
  };

  await axios.post(
    'https://tu-backend.com/api/whatsapp/metrics',
    metrics
  );
}
```

### Enviar eventos

```typescript
async function sendEvent(type: string, message: string) {
  await axios.post(
    'https://tu-backend.com/api/whatsapp/events',
    {
      type,
      status: 'success',
      message,
      details: {}
    }
  );
}
```

## 📊 Auto-Refresh

- StatusCard: 30 segundos
- MetricsCard: 30 segundos
- EventsLog: 15 segundos

## 🎯 Próximos Pasos (Fase 2)

- [ ] Gráficos de tendencias
- [ ] Alertas automáticas
- [ ] Filtros de eventos
- [ ] Exportación de datos
- [ ] Histórico de métricas

## ✅ Checklist

- [x] SQL schema creado
- [x] API endpoints implementados
- [x] Componentes React creados
- [x] Página principal creada
- [x] Auto-refresh configurado
- [ ] Deploy a Vercel
- [ ] Integrar con Baileys Worker

## 📝 Notas

- El panel es read-only para visualización
- Las actualizaciones vienen de Baileys Worker
- Métricas se resetean cada día
- Eventos se mantienen históricos

