# Feedback API

## POST /api/feedback/confirm

Confirma o corrige una predicción de Groq.

### Request Body
```json
{
  "prediction_id": "uuid",
  "confirmado": true,  // true = correcto, false = incorrecto
  "comentario": "opcional - detalles de la corrección"
}
```

### Response
```json
{
  "status": "success",
  "message": "Predicción confirmada correctamente"
}
```

## GET /api/feedback/confirm?usuario_id=uuid

Obtiene estadísticas de feedback del usuario.

### Response
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "confirmadas": 85,
    "rechazadas": 10,
    "pendientes": 5,
    "accuracy": "89.47%"
  },
  "recent_predictions": [...]
}
```

