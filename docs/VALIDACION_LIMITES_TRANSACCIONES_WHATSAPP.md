# 🛡️ Validación de Límites de Transacciones en WhatsApp

## 📋 PROBLEMA ACTUAL

El sistema NO valida límites de transacciones diarias antes de procesar mensajes de WhatsApp. Esto permite que usuarios excedan su límite diario, especialmente con transacciones múltiples.

### Ejemplo del problema:
- Usuario con plan **PRO** (20 transacciones/día)
- Ya tiene **20 transacciones** realizadas hoy (completadas + eliminadas)
- Envía un mensaje con **4 transacciones múltiples**
- El sistema procesa las 4 transacciones → **Total: 24 transacciones** ❌

---

## 🎯 CASOS A CUBRIR

### **Caso 1: Usuario alcanzó el límite exacto**
- Usuario tiene **20/20** transacciones (plan PRO)
- Envía mensaje con **8 transacciones**
- **Acción:** NO procesar ninguna, enviar mensaje informativo

**Mensaje sugerido:**
```
⚠️ Límite alcanzado

Ya has realizado 20 transacciones hoy (tu límite diario).

Puedes crear más transacciones mañana o actualizar a un plan superior.

📱 Actualiza tu plan en la app
```

---

### **Caso 2: Usuario cerca del límite (puede guardar algunas)**
- Usuario tiene **19/20** transacciones (plan PRO)
- Envía mensaje con **8 transacciones**
- **Acción:** NO procesar ninguna. Usuario debe reenviar con cantidad exacta que le falta.

**Mensaje sugerido:**
```
⚠️ Límite parcial

Ya has realizado 19 transacciones hoy. Solo puedes guardar 1 más.

Por favor, envía un nuevo mensaje con solo 1 transacción (o menos).

Ejemplo: "Gasté 50 en taxi"
```

---

### **Caso 3: Usuario puede guardar algunas pero no todas**
- Usuario tiene **18/20** transacciones (plan PRO)
- Envía mensaje con **8 transacciones**
- **Acción:** NO procesar ninguna. Usuario debe reenviar con cantidad exacta que le falta.

**Mensaje sugerido:**
```
⚠️ Límite parcial

Ya has realizado 18 transacciones hoy. Solo puedes guardar 2 más.

Por favor, envía un nuevo mensaje con solo 2 transacciones (o menos).

Ejemplo: "Gasté 50 en taxi y 30 en comida"
```

---

### **Caso 4: Usuario puede guardar todas**
- Usuario tiene **12/20** transacciones (plan PRO)
- Envía mensaje con **8 transacciones**
- **Acción:** Puede guardar todas (12 + 8 = 20 ✅)

**Mensaje:** Procesar normalmente con preview

---

## 🔧 IMPLEMENTACIÓN PROPUESTA

### **1. Función de validación mejorada**

Crear función `validateTransactionLimitForMultiple` que:
- Cuenta transacciones actuales del día
- Calcula cuántas puede guardar
- Retorna información detallada para mensajes personalizados

```typescript
interface TransactionLimitResult {
  canProcess: boolean;
  currentCount: number;
  maxAllowed: number;
  requestedCount: number;
  canProcessCount: number; // Cuántas puede procesar
  remainingSlots: number; // Espacios disponibles
  message?: string; // Mensaje personalizado si no puede procesar todas
}
```

### **2. Puntos de validación**

**A. ANTES de procesar con Groq:**
- Validar límite básico (1 transacción)
- Si ya alcanzó → NO procesar, enviar mensaje

**B. DESPUÉS de procesar con Groq (si es múltiple):**
- Si detectó múltiples transacciones
- Validar cuántas puede guardar
- Si no puede guardar todas → NO guardar ninguna, mensaje informativo pidiendo reenviar

### **3. Flujo de decisión**

```
1. Usuario envía mensaje
   ↓
2. Validar límite básico (¿puede crear al menos 1?)
   ↓
3. Si NO → Enviar mensaje de límite alcanzado, FIN
   ↓
4. Si SÍ → Procesar con Groq
   ↓
5. ¿Es múltiple?
   ↓
6. Si NO → Procesar normalmente
   ↓
7. Si SÍ → Validar cuántas puede guardar
   ↓
8. ¿Puede guardar todas?
   ↓
9. Si SÍ → Procesar todas normalmente
   ↓
10. Si NO → NO guardar ninguna, enviar mensaje informativo pidiendo reenviar con cantidad exacta
```

---

## 📊 LÍMITES POR PLAN

| Plan | Límite Diario |
|------|---------------|
| **Free** | 10 transacciones |
| **Smart** | 10 transacciones |
| **Pro** | 20 transacciones |
| **Caducado** | 3 transacciones |

**Nota:** Se cuentan TODAS las transacciones del día (activas + eliminadas) para evitar que usuarios eliminen y vuelvan a crear.

---

## 💬 MENSAJES PROPUESTOS

### **Límite alcanzado completamente:**
```
⚠️ *Límite alcanzado*

Ya has realizado {currentCount} transacciones hoy (tu límite diario).

Puedes crear más transacciones mañana o actualizar a un plan superior.

📱 Actualiza tu plan en la app
```

### **Límite parcial (puede guardar algunas):**
```
⚠️ *Límite parcial*

Ya has realizado {currentCount} transacciones hoy. Solo puedes guardar {canProcessCount} más.

Por favor, envía un nuevo mensaje con solo {canProcessCount} transacción{canProcessCount > 1 ? 'es' : ''} (o menos).

Ejemplo: {ejemplo según cantidad}
```

### **Cerca del límite (advertencia):**
```
ℹ️ *Advertencia*

Ya has realizado {currentCount} de {maxAllowed} transacciones hoy.

Tienes {remainingSlots} espacios disponibles.
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Crear función `validateTransactionLimitForMultiple`
- [ ] Integrar validación en webhook de WhatsApp
- [ ] Validar ANTES de procesar con Groq
- [ ] Validar DESPUÉS si es múltiple
- [ ] Crear mensajes personalizados según casos
- [ ] Probar casos: límite alcanzado, parcial, normal
- [ ] Probar con diferentes planes (free, smart, pro, caducado)
- [ ] Documentar comportamiento

---

## 🔍 ARCHIVOS A MODIFICAR

1. `packages/core-api/src/lib/planLimits.ts`
   - Agregar función `validateTransactionLimitForMultiple`

2. `packages/core-api/src/app/api/webhooks/whatsapp/route.ts`
   - Integrar validación antes de procesar
   - Integrar validación después si es múltiple
   - Enviar mensajes informativos

3. `packages/core-api/src/lib/whatsappCloudApi.ts`
   - (Ya existe, solo usar para enviar mensajes)

---

## ✅ DECISIONES TOMADAS

1. **¿Qué hacer cuando el usuario puede guardar solo algunas?**
   - ✅ **DECIDIDO:** NO guardar ninguna. Usuario debe reenviar mensaje con cantidad exacta que le falta (o menor).
   - **Razón:** Evita confusión y mantiene el flujo simple. El usuario controla qué transacciones incluir en su nuevo mensaje.

2. **¿Mostrar preview cuando hay límite parcial?**
   - ✅ **DECIDIDO:** NO mostrar preview. Solo enviar mensaje informativo.
   - **Razón:** Si no vamos a procesar, no tiene sentido mostrar preview. El usuario debe reenviar con menos transacciones.

3. **¿Aplicar límite a transacciones pendientes de confirmación?**
   - ✅ **DECIDIDO:** Solo contar las confirmadas/guardadas.
   - **Razón:** Las pendientes aún no "consumen" el límite hasta que se confirmen. Esto permite flexibilidad.

---

## 📝 NOTAS ADICIONALES

- La validación debe ser **rápida** para no retrasar el procesamiento
- Los mensajes deben ser **claros y útiles**
- Considerar **experiencia de usuario** al máximo
- Mantener **consistencia** con el resto del sistema

