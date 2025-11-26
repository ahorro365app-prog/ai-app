# 💰 WhatsApp Cloud API: Modelo de Costos Actualizado 2025

**Última actualización:** 19 Nov 2025  
**Fuente:** Meta WhatsApp Business API (Modelo actualizado desde Julio 2025)

---

## 📊 Resumen Ejecutivo

### ✅ Para tu Caso de Uso: **COSTO CASI CERO**

**Tu modelo de negocio:**
- ✅ Usuarios escriben primero (transacciones)
- ✅ Tú respondes dentro de 24 horas
- ✅ Solo envías códigos de verificación (inicio de sesión)

**Costo estimado:**
- **Respuestas a transacciones:** **$0.00** (GRATIS) ✅
- **Códigos de verificación:** ~$0.007 por código
- **Total mensual (1000 usuarios):** **~$0-7/mes** ✅

---

## 🆓 Mensajes GRATIS (Ventana de 24 Horas)

### Mensajes de Utilidad (Dentro de Ventana de 24h)

**Condiciones:**
1. ✅ Usuario escribió primero
2. ✅ Tú respondes dentro de 24 horas desde el último mensaje del usuario
3. ✅ Mensaje es de "utilidad" (no marketing)

**Costo:** **$0.00 (GRATIS)** ✅

**Ejemplos de mensajes de utilidad:**
- ✅ Confirmaciones de transacciones
- ✅ Respuestas a preguntas del usuario
- ✅ Actualizaciones de estado
- ✅ Preview de transacciones procesadas
- ✅ Confirmaciones de guardado

**Tu caso:**
```
Usuario: "Gasté 50 bs en pan" (escribe primero)
  ↓
Tú respondes: "✅ TEXTO PROCESADO
                Monto (Bs): 50
                Tipo: gasto
                ...
                ¿Está bien?" (dentro de 24h)
  ↓
Costo: $0.00 (GRATIS) ✅
```

---

## 💰 Mensajes que SIEMPRE se Cobran

### 1. Mensajes de Autenticación

**Características:**
- ⚠️ **SIEMPRE se cobran** (incluso dentro de ventana de 24h)
- No hay ventana gratuita para autenticación
- Requieren templates aprobados si es fuera de ventana

**Costo por región:**
- **Brasil:** ~$0.0068 USD por mensaje
- **América Latina:** ~$0.0068-0.009 USD por mensaje
- **Estados Unidos:** ~$0.005 USD por mensaje

**Ejemplos:**
- Códigos de verificación (OTP)
- Contraseñas de un solo uso
- Tokens de acceso

**Tu caso:**
```
Tú envías: "Tu código de verificación es: 123456" (inicio de sesión)
  ↓
Costo: ~$0.007 por código
  ↓
Si envías 1000 códigos/mes: ~$7/mes
```

### 2. Mensajes de Marketing

**Características:**
- ⚠️ **SIEMPRE se cobran**
- No hay ventana gratuita
- Requieren templates aprobados

**Costo por región:**
- **Brasil:** ~$0.0135 USD por mensaje
- **América Latina:** ~$0.0135-0.018 USD por mensaje

**Ejemplos:**
- Promociones
- Ofertas especiales
- Recordatorios de carrito
- Contenido promocional

**Tu caso:** No aplica (no envías marketing)

### 3. Mensajes Fuera de Ventana de 24h

**Características:**
- ⚠️ Requieren **Templates aprobados** por Meta
- Se cobran según categoría (utilidad, autenticación, marketing)
- No hay ventana gratuita

**Tu caso:** No aplica (siempre respondes dentro de 24h)

---

## 📊 Estimación de Costos para tu Caso

### Escenario 1: Solo Transacciones (Ideal)

**Suposiciones:**
- 1000 usuarios activos/mes
- Cada usuario envía 10 transacciones/mes
- Tú respondes dentro de 24h
- No envías códigos de verificación

**Cálculo:**
- 10,000 respuestas/mes
- Todas dentro de ventana de 24h
- Todas iniciadas por usuario

**Costo:** **$0.00 (GRATIS)** ✅

---

### Escenario 2: Transacciones + Códigos de Verificación

**Suposiciones:**
- 1000 usuarios activos/mes
- Cada usuario envía 10 transacciones/mes
- 1000 códigos de verificación/mes (nuevos usuarios)

**Cálculo:**
- 10,000 respuestas a transacciones: **$0.00** (GRATIS)
- 1000 códigos de verificación: 1000 × $0.007 = **$7.00**

**Costo Total:** **~$7/mes** ✅

---

### Escenario 3: Alto Volumen

**Suposiciones:**
- 10,000 usuarios activos/mes
- Cada usuario envía 10 transacciones/mes
- 5,000 códigos de verificación/mes

**Cálculo:**
- 100,000 respuestas a transacciones: **$0.00** (GRATIS)
- 5,000 códigos de verificación: 5,000 × $0.007 = **$35.00**

**Costo Total:** **~$35/mes** ✅

---

## 🎯 Ventajas para tu Caso Específico

### 1. Costo Casi Cero

**Razón:**
- ✅ Usuarios siempre escriben primero
- ✅ Respondes dentro de 24h
- ✅ Solo pagas códigos de verificación

**Comparación:**
- **Baileys:** ~$6-144/mes (infraestructura)
- **API Cloud:** ~$0-7/mes (solo códigos)
- **Ahorro:** ~$6-137/mes ✅

### 2. Sin Límites de Ventana

**Razón:**
- ✅ Siempre respondes dentro de 24h
- ✅ No necesitas templates para respuestas
- ✅ Flexibilidad total en mensajes

### 3. Escalabilidad Sin Costo Adicional

**Razón:**
- ✅ Más usuarios = Más respuestas gratis
- ✅ Solo pagas códigos (proporcional al crecimiento)
- ✅ No hay costos de infraestructura adicionales

---

## ⚠️ Consideraciones Importantes

### 1. Códigos de Verificación

**Costo:**
- ~$0.007 por código
- Se cobra SIEMPRE (incluso dentro de ventana)

**Estrategias para reducir costos:**
- ✅ Usar códigos solo cuando sea necesario
- ✅ Implementar rate limiting (1 código cada X minutos)
- ✅ Considerar alternativas (email, SMS) para algunos casos

**Estimación:**
- Si tienes 100 nuevos usuarios/mes: ~$0.70/mes
- Si tienes 1000 nuevos usuarios/mes: ~$7/mes
- Si tienes 10,000 nuevos usuarios/mes: ~$70/mes

### 2. Ventana de 24 Horas

**Importante:**
- La ventana se abre cuando el usuario escribe
- Se cierra 24 horas después del último mensaje del usuario
- Si respondes después de 24h, necesitas template (y se cobra)

**Tu caso:**
- ✅ Siempre respondes inmediatamente
- ✅ No hay riesgo de perder la ventana
- ✅ Todas las respuestas son gratis

### 3. Templates para Mensajes Proactivos

**Cuándo necesitas templates:**
- Mensajes fuera de ventana de 24h
- Mensajes de marketing
- Mensajes de autenticación (si es fuera de ventana)

**Tu caso:**
- ⚠️ Códigos de verificación: Necesitas template
- ✅ Respuestas a transacciones: No necesitas template (dentro de ventana)

---

## 📋 Comparación de Costos

### Baileys (Actual)

| Componente | Costo Mensual |
|------------|---------------|
| Fly.io (24/7) | ~$144/mes |
| Fly.io (auto-stop) | ~$6-12/mes |
| Volumen persistente | ~$0.15/mes |
| **Total** | **~$6-144/mes** |

### WhatsApp API Cloud

| Componente | Costo Mensual |
|------------|---------------|
| Respuestas a transacciones | **$0.00** (GRATIS) |
| Códigos de verificación (1000/mes) | ~$7/mes |
| **Total** | **~$0-7/mes** |

**Ahorro:** **~$6-137/mes** ✅

---

## 🎯 Conclusión

### Para tu Caso de Uso

**WhatsApp API Cloud es PERFECTO porque:**

1. ✅ **Costo casi cero:** Solo pagas códigos de verificación
2. ✅ **Modelo ideal:** Usuarios escriben primero → Respuestas gratis
3. ✅ **Sin mantenimiento:** No necesitas mantener sesión
4. ✅ **Escalable:** Más usuarios = Mismo costo por código
5. ✅ **Estable:** Servicio oficial de Meta

### Estimación Realista

**Para 1000 usuarios activos/mes:**
- Respuestas a transacciones: **$0.00** (GRATIS)
- Códigos de verificación: **~$7/mes**
- **Total: ~$7/mes** ✅

**Comparado con Baileys:**
- **Ahorro: ~$137/mes** (si usas 24/7)
- **Ahorro: ~$5/mes** (si usas auto-stop)

---

## 📝 Notas Finales

### Ventana de 24 Horas

**Cómo funciona:**
1. Usuario escribe: "Gasté 50 bs"
2. Ventana de 24h se abre
3. Puedes responder gratis durante 24h
4. Después de 24h, necesitas template (y se cobra)

**Tu caso:**
- ✅ Siempre respondes inmediatamente
- ✅ No hay riesgo de perder la ventana
- ✅ Todas las respuestas son gratis

### Códigos de Verificación

**Estrategia:**
- ✅ Usar solo cuando sea necesario
- ✅ Implementar rate limiting
- ✅ Considerar alternativas para algunos casos

**Costo aceptable:**
- ~$0.007 por código es muy bajo
- Solo se cobra cuando realmente lo necesitas
- Proporcional al crecimiento

---

**Última actualización:** 19 Nov 2025  
**Recomendación:** WhatsApp API Cloud es **MUY RECOMENDADO** para tu caso de uso

