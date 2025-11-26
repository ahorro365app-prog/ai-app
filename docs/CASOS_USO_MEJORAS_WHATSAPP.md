# 📱 Casos de Uso - Mejoras WhatsApp Cloud API para Ahorro365

> **Fecha:** 2025-01-21  
> **Propósito:** Explicar casos de uso específicos para cada mejora propuesta  
> **Estado:** 📋 Análisis de Casos de Uso

---

## 📋 Índice

1. [Confirmación con Botones Interactivos](#1-confirmación-con-botones-interactivos)
2. [Comandos de Usuario](#2-comandos-de-usuario)
3. [Plantillas para Notificaciones](#3-plantillas-para-notificaciones)
4. [Selección de Categoría con Lista](#4-selección-de-categoría-con-lista)
5. [OCR para Comprobantes](#5-ocr-para-comprobantes)
6. [Resúmenes Automáticos](#6-resúmenes-automáticos)
7. [Quick Replies para Acciones](#7-quick-replies-para-acciones)
8. [Geotagging de Transacciones](#8-geotagging-de-transacciones)
9. [Reacciones para Confirmación](#9-reacciones-para-confirmación)

---

## 1. Confirmación con Botones Interactivos

### 🎯 Casos de Uso

#### Caso 1: Confirmación de Transacción Simple
**Cuándo se activa:**
- Usuario envía audio/texto con UNA transacción
- Groq extrae los datos correctamente
- Sistema crea preview y envía mensaje

**Flujo actual:**
```
Usuario: "50 de taxi"
Sistema: "✅ TEXTO PROCESADO
📉 GASTO
Monto: 50 Bs
¿Está bien?
✅ Responde: sí / ok / perfecto"
Usuario: "sí" (debe escribir)
```

**Flujo mejorado:**
```
Usuario: "50 de taxi"
Sistema: [Mensaje con 2 botones]
         ┌─────────────────┐
         │ ✅ Sí, está bien │
         │ ❌ No, corregir  │
         └─────────────────┘
Usuario: [Clic en botón] → Confirmación instantánea
```

**Beneficio:** Confirmación en 1 clic vs escribir texto

---

#### Caso 2: Confirmación de Múltiples Transacciones
**Cuándo se activa:**
- Usuario envía audio/texto con VARIAS transacciones
- Ejemplo: "10 de zanahoria, 30 de alverja, 50 de zapallo"

**Flujo mejorado:**
```
Usuario: "10 de zanahoria, 30 de alverja, 50 de zapallo"
Sistema: [Mensaje con lista de transacciones + 2 botones]
         ┌─────────────────┐
         │ ✅ Sí, todas bien │
         │ ❌ No, corregir   │
         └─────────────────┘
```

**Beneficio:** Confirmar todas de una vez vs escribir "sí"

---

#### Caso 3: Corrección de Transacción
**Cuándo se activa:**
- Usuario presiona "❌ No, corregir"
- Sistema pregunta qué corregir

**Flujo:**
```
Usuario: [Clic en "❌ No, corregir"]
Sistema: [Mensaje con botones]
         ┌─────────────────────┐
         │ 💰 Cambiar monto    │
         │ 📁 Cambiar categoría │
         │ 📝 Cambiar descripción│
         │ ❌ Cancelar          │
         └─────────────────────┘
```

**Beneficio:** Corrección guiada sin escribir

---

### 📊 Impacto Esperado

- **Tiempo de confirmación:** 2-5 min → 10-30 seg
- **Tasa de confirmación:** 60% → 85%+
- **Errores de escritura:** 10% → 0%

---

## 2. Comandos de Usuario

### 🎯 Casos de Uso

#### Caso 1: Resumen del Día
**Cuándo se activa:**
- Usuario escribe `/resumen` o `/dia`
- En cualquier momento del día

**Flujo:**
```
Usuario: "/resumen"
Sistema: "📊 *Resumen del Día*
━━━━━━━━━━━━━━━━━━━━
📉 Gastos: 150 Bs
📈 Ingresos: 0 Bs
━━━━━━━━━━━━━━━━━━━━
💰 Balance: -150 Bs

📁 Top categorías:
1. 🍔 Comida: 80 Bs
2. 🚗 Transporte: 50 Bs
3. 🏥 Salud: 20 Bs

📊 Transacciones: 5
⏰ Límite diario: 15/20 usadas"
```

**Beneficio:** Ver resumen sin abrir app

---

#### Caso 2: Resumen Semanal
**Cuándo se activa:**
- Usuario escribe `/semana` o `/semanal`
- Útil para planificación

**Flujo:**
```
Usuario: "/semana"
Sistema: "📊 *Resumen Semanal*
━━━━━━━━━━━━━━━━━━━━
📉 Total gastos: 1,200 Bs
📈 Total ingresos: 500 Bs
💰 Balance: -700 Bs

📈 Tendencia: ⬇️ -15% vs semana anterior

📁 Categorías principales:
1. 🍔 Comida: 600 Bs (50%)
2. 🚗 Transporte: 300 Bs (25%)
3. 🏥 Salud: 200 Bs (17%)
4. 📦 Otros: 100 Bs (8%)"
```

**Beneficio:** Análisis rápido sin app

---

#### Caso 3: Estado de Límite Diario
**Cuándo se activa:**
- Usuario escribe `/limite` o `/límite`
- Especialmente útil para planes con límites

**Flujo:**
```
Usuario: "/limite"
Sistema: "⏰ *Límite Diario*
━━━━━━━━━━━━━━━━━━━━
📊 Usadas: 15/20 transacciones
━━━━━━━━━━━━━━━━━━━━
✅ Puedes crear 5 más hoy

💡 Plan: Smart
📅 Se renueva mañana"
```

**Beneficio:** Saber cuántas transacciones quedan

---

#### Caso 4: Gastos por Categoría
**Cuándo se activa:**
- Usuario escribe `/categorias` o `/categorías`
- Para análisis detallado

**Flujo:**
```
Usuario: "/categorias"
Sistema: "📁 *Gastos por Categoría (Hoy)*
━━━━━━━━━━━━━━━━━━━━
1. 🍔 Comida: 80 Bs (53%)
2. 🚗 Transporte: 50 Bs (33%)
3. 🏥 Salud: 20 Bs (13%)
━━━━━━━━━━━━━━━━━━━━
Total: 150 Bs"
```

**Beneficio:** Ver dónde se gasta más

---

#### Caso 5: Ayuda/Comandos Disponibles
**Cuándo se activa:**
- Usuario escribe `/ayuda` o `/help`
- Para descubrir funcionalidades

**Flujo:**
```
Usuario: "/ayuda"
Sistema: "❓ *Comandos Disponibles*
━━━━━━━━━━━━━━━━━━━━
/resumen     → Resumen del día
/semana      → Resumen semanal
/mes         → Resumen mensual
/categorias  → Gastos por categoría
/limite      → Estado de límite diario
/ayuda       → Ver esta ayuda
━━━━━━━━━━━━━━━━━━━━
💡 Tip: Puedes usar comandos en cualquier momento"
```

**Beneficio:** Descubrir funcionalidades

---

### 📊 Impacto Esperado

- **Uso de comandos:** 0% → 30-40% de usuarios
- **Reducción de uso de app:** 20-30% menos aperturas
- **Satisfacción:** Mayor engagement

---

## 3. Plantillas para Notificaciones

### 🎯 Casos de Uso

#### Caso 1: Recordatorio de Límite Diario
**Cuándo se activa:**
- Usuario tiene plan con límite (Smart/Pro)
- Ha usado 80% del límite diario
- Se envía automáticamente

**Flujo:**
```
Sistema: [Template: "recordatorio_limite"]
         "⏰ *Recordatorio de Límite*
━━━━━━━━━━━━━━━━━━━━
Has usado 16/20 transacciones hoy.

✅ Puedes crear 4 más antes de mañana.

💡 Plan: Smart
📅 Se renueva en 6 horas"
```

**Beneficio:** Evitar sorpresas al llegar al límite

---

#### Caso 2: Resumen Semanal Automático
**Cuándo se activa:**
- Todos los domingos a las 20:00
- Se envía automáticamente a todos los usuarios activos

**Flujo:**
```
Sistema: [Template: "resumen_semanal"]
         "📊 *Resumen de la Semana*
━━━━━━━━━━━━━━━━━━━━
📉 Total gastos: 1,200 Bs
📈 Total ingresos: 500 Bs
💰 Balance: -700 Bs

📈 Tendencia: ⬇️ -15% vs semana anterior

📁 Top categoría: 🍔 Comida (600 Bs)

💡 Consejo: Intenta reducir gastos en comida esta semana"
```

**Beneficio:** Análisis automático sin acción del usuario

---

#### Caso 3: Alerta de Presupuesto
**Cuándo se activa:**
- Usuario tiene presupuesto diario configurado
- Ha gastado 90% del presupuesto
- Se envía automáticamente

**Flujo:**
```
Sistema: [Template: "alerta_presupuesto"]
         "⚠️ *Alerta de Presupuesto*
━━━━━━━━━━━━━━━━━━━━
Has gastado 180/200 Bs hoy.

💰 Te quedan 20 Bs disponibles.

💡 Sugerencia: Revisa tus gastos antes de continuar."
```

**Beneficio:** Control de presupuesto proactivo

---

#### Caso 4: Notificación de Referido Verificado
**Cuándo se activa:**
- Usuario invitó a un amigo
- El amigo se registró y verificó su cuenta
- Se envía automáticamente

**Flujo:**
```
Sistema: [Template: "referido_verificado"]
         "🎉 *¡Referido Verificado!*
━━━━━━━━━━━━━━━━━━━━
Tu amigo *Juan Pérez* se registró.

✅ Has ganado 7 días de plan Smart.

📅 Tu plan Smart activo hasta: 28/01/2025

💜 ¡Gracias por recomendar Ahorro365!"
```

**Beneficio:** Motivación para invitar más amigos

---

#### Caso 5: Recordatorio de Transacción Recurrente
**Cuándo se activa:**
- Sistema detecta transacción recurrente
- Fecha esperada se acerca (1 día antes)
- Se envía automáticamente

**Flujo:**
```
Sistema: [Template: "recordatorio_recurrente"]
         "⏰ *Recordatorio*
━━━━━━━━━━━━━━━━━━━━
Mañana es la fecha esperada de:

📉 *Taxi al trabajo*
💰 Monto usual: 50 Bs
📅 Última vez: Hace 7 días

💡 ¿Ya lo pagaste? Envía un mensaje para registrarlo."
```

**Beneficio:** No olvidar transacciones recurrentes

---

### 📊 Impacto Esperado

- **Engagement:** +40% usuarios activos
- **Retención:** +25% usuarios que regresan
- **Uso de app:** +30% transacciones registradas

---

## 4. Selección de Categoría con Lista

### 🎯 Casos de Uso

#### Caso 1: Categoría con Baja Confianza
**Cuándo se activa:**
- Groq extrae transacción pero confianza en categoría < 70%
- Sistema no está seguro de la categoría

**Flujo:**
```
Usuario: "50 en el mercado"
Sistema: [Groq detecta: monto=50, categoría="comida" (confianza: 60%)]
         [Mensaje con lista]
         "✅ *TEXTO PROCESADO*
━━━━━━━━━━━━━━━━━━━━
📉 GASTO
💰 Monto: 50 Bs
📁 Categoría: comida (¿correcto?)

Selecciona la categoría correcta:
┌─────────────────────┐
│ 🍔 Comida           │
│ 🚗 Transporte       │
│ 🏥 Salud            │
│ 🛒 Compras          │
│ 📦 Otros            │
└─────────────────────┘"
```

**Beneficio:** Mayor precisión en categorización

---

#### Caso 2: Categoría Ambigua
**Cuándo se activa:**
- Texto puede ser múltiples categorías
- Ejemplo: "50 en farmacia" → Salud o Compras?

**Flujo:**
```
Usuario: "50 en farmacia"
Sistema: [Groq: categoría="salud" (confianza: 65%)]
         [Mensaje con lista]
         "¿Es correcto categorizar como 🏥 Salud?
         
         O selecciona otra:
         ┌─────────────────────┐
         │ 🏥 Salud            │
         │ 🛒 Compras          │
         │ 🏪 Farmacia         │
         │ 📦 Otros            │
         └─────────────────────┘"
```

**Beneficio:** Evitar categorización incorrecta

---

#### Caso 3: Corrección Manual de Categoría
**Cuándo se activa:**
- Usuario presiona "❌ No, corregir" en preview
- Selecciona "Cambiar categoría"

**Flujo:**
```
Usuario: [Clic en "❌ No, corregir"]
Sistema: "¿Qué quieres corregir?"
         ┌─────────────────────┐
         │ 📁 Cambiar categoría │
         └─────────────────────┘
Usuario: [Clic]
Sistema: [Lista de categorías]
         ┌─────────────────────┐
         │ 🍔 Comida           │
         │ 🚗 Transporte       │
         │ 🏥 Salud            │
         │ 🛒 Compras          │
         │ 🏠 Hogar            │
         │ 🎮 Entretenimiento  │
         │ 📦 Otros            │
         └─────────────────────┘
```

**Beneficio:** Corrección rápida y precisa

---

### 📊 Impacto Esperado

- **Precisión de categorías:** 75% → 95%+
- **Satisfacción del usuario:** Mayor control
- **Calidad de datos:** Mejor análisis

---

## 5. OCR para Comprobantes

### 🎯 Casos de Uso

#### Caso 1: Foto de Factura/Recibo
**Cuándo se activa:**
- Usuario envía imagen (foto de factura/recibo)
- Sistema detecta que es imagen, no audio/texto

**Flujo:**
```
Usuario: [Envía foto de factura de restaurante]
Sistema: "📷 *Imagen recibida*
━━━━━━━━━━━━━━━━━━━━
Procesando comprobante...

[OCR extrae texto]
"RESTAURANTE XYZ
Fecha: 21/01/2025
Total: 120 Bs
Categoría: Comida"

[Groq procesa y crea transacción]
✅ *COMPROBANTE PROCESADO*
━━━━━━━━━━━━━━━━━━━━
📉 GASTO
💰 Monto: 120 Bs
📁 Categoría: comida
📅 Fecha: 21/01/2025
🏪 Establecimiento: Restaurante XYZ

¿Está bien?"
```

**Beneficio:** Registrar transacciones sin escribir

---

#### Caso 2: Foto de Ticket de Estacionamiento
**Cuándo se activa:**
- Usuario envía foto de ticket
- OCR extrae monto y fecha

**Flujo:**
```
Usuario: [Envía foto de ticket de estacionamiento]
Sistema: [OCR extrae]
         "ESTACIONAMIENTO
         Monto: 15 Bs
         Fecha: 21/01/2025 14:30"

[Groq procesa]
✅ *COMPROBANTE PROCESADO*
━━━━━━━━━━━━━━━━━━━━
📉 GASTO
💰 Monto: 15 Bs
📁 Categoría: transporte
📅 Fecha: 21/01/2025 14:30
🏪 Establecimiento: Estacionamiento

¿Está bien?"
```

**Beneficio:** Registrar gastos pequeños rápidamente

---

#### Caso 3: Foto de Factura de Servicios
**Cuándo se activa:**
- Usuario envía foto de factura (luz, agua, internet)
- OCR extrae datos

**Flujo:**
```
Usuario: [Envía foto de factura de luz]
Sistema: [OCR extrae]
         "EMPRESA DE LUZ
         Periodo: Dic 2024
         Total a pagar: 180 Bs
         Vencimiento: 25/01/2025"

[Groq procesa]
✅ *COMPROBANTE PROCESADO*
━━━━━━━━━━━━━━━━━━━━
📉 GASTO
💰 Monto: 180 Bs
📁 Categoría: servicios
📅 Fecha: 21/01/2025
🏪 Establecimiento: Empresa de Luz
📅 Vencimiento: 25/01/2025

💡 ¿Ya pagaste esta factura?"
```

**Beneficio:** Registrar facturas sin escribir

---

### 📊 Impacto Esperado

- **Facilidad de registro:** +50% usuarios registran más
- **Precisión de datos:** Mayor (fechas, montos exactos)
- **Tiempo de registro:** 30 seg → 5 seg (solo foto)

---

## 6. Resúmenes Automáticos

### 🎯 Casos de Uso

#### Caso 1: Resumen Diario (Fin de Día)
**Cuándo se activa:**
- Todos los días a las 22:00
- Solo si el usuario tuvo actividad ese día

**Flujo:**
```
Sistema: [Template automático a las 22:00]
         "📊 *Resumen del Día*
━━━━━━━━━━━━━━━━━━━━
📉 Gastos: 150 Bs
📈 Ingresos: 0 Bs
━━━━━━━━━━━━━━━━━━━━
💰 Balance: -150 Bs

📁 Top categorías:
1. 🍔 Comida: 80 Bs (53%)
2. 🚗 Transporte: 50 Bs (33%)
3. 🏥 Salud: 20 Bs (13%)

📊 Transacciones: 5
⏰ Límite: 15/20 usadas

💡 Consejo: Has gastado más en comida hoy. 
   Considera cocinar en casa mañana."
```

**Beneficio:** Análisis diario automático

---

#### Caso 2: Resumen Semanal (Domingo)
**Cuándo se activa:**
- Todos los domingos a las 20:00
- Resumen de la semana completa

**Flujo:**
```
Sistema: [Template automático domingos 20:00]
         "📊 *Resumen Semanal*
━━━━━━━━━━━━━━━━━━━━
📉 Total gastos: 1,200 Bs
📈 Total ingresos: 500 Bs
💰 Balance: -700 Bs

📈 Tendencia: ⬇️ -15% vs semana anterior

📁 Categorías principales:
1. 🍔 Comida: 600 Bs (50%)
2. 🚗 Transporte: 300 Bs (25%)
3. 🏥 Salud: 200 Bs (17%)

💡 Consejo: Has gastado mucho en comida esta semana.
   Intenta cocinar más en casa la próxima semana."
```

**Beneficio:** Análisis semanal sin acción

---

#### Caso 3: Resumen Mensual (Primer día del mes)
**Cuándo se activa:**
- Primer día de cada mes a las 09:00
- Resumen del mes anterior

**Flujo:**
```
Sistema: [Template automático 1er día del mes]
         "📊 *Resumen de Enero 2025*
━━━━━━━━━━━━━━━━━━━━
📉 Total gastos: 4,800 Bs
📈 Total ingresos: 2,000 Bs
💰 Balance: -2,800 Bs

📈 Tendencia: ⬇️ -10% vs diciembre

📁 Top categorías:
1. 🍔 Comida: 2,400 Bs (50%)
2. 🚗 Transporte: 1,200 Bs (25%)
3. 🏥 Salud: 800 Bs (17%)

💡 Consejo: Has gastado 2,400 Bs en comida este mes.
   Considera un presupuesto de 2,000 Bs para febrero."
```

**Beneficio:** Análisis mensual completo

---

### 📊 Impacto Esperado

- **Engagement:** +40% usuarios revisan resúmenes
- **Retención:** +25% usuarios regresan
- **Conciencia financiera:** Mayor

---

## 7. Quick Replies para Acciones

### 🎯 Casos de Uso

#### Caso 1: Después de Guardar Transacción
**Cuándo se activa:**
- Transacción confirmada y guardada
- Sistema ofrece acciones rápidas

**Flujo:**
```
Sistema: "✅ Transacción guardada"
         ┌─────────────────────┐
         │ 📊 Ver resumen       │
         │ 📈 Reporte del día   │
         │ ❓ Ayuda             │
         └─────────────────────┘
```

**Beneficio:** Acceso rápido a funciones

---

#### Caso 2: Cuando se Alcanza Límite
**Cuándo se activa:**
- Usuario alcanza 80% del límite diario
- Sistema ofrece opciones

**Flujo:**
```
Sistema: "⚠️ Has usado 16/20 transacciones"
         ┌─────────────────────┐
         │ 📊 Ver resumen       │
         │ ⬆️ Actualizar plan   │
         │ ❓ Más información   │
         └─────────────────────┘
```

**Beneficio:** Guiar al usuario

---

### 📊 Impacto Esperado

- **Descubrimiento de funciones:** +30%
- **Uso de funciones:** +25%

---

## 8. Geotagging de Transacciones

### 🎯 Casos de Uso

#### Caso 1: Transacción con Ubicación
**Cuándo se activa:**
- Usuario envía transacción + ubicación
- Opcional: "50 de taxi" + [comparte ubicación]

**Flujo:**
```
Usuario: "50 de taxi" [comparte ubicación]
Sistema: "✅ *TEXTO PROCESADO*
━━━━━━━━━━━━━━━━━━━━
📉 GASTO
💰 Monto: 50 Bs
📁 Categoría: transporte
📍 Ubicación: Av. 6 de Agosto, La Paz

¿Está bien?"
```

**Beneficio:** Análisis de gastos por ubicación

---

#### Caso 2: Recordatorio de Lugar Frecuente
**Cuándo se activa:**
- Usuario está cerca de lugar donde gasta frecuentemente
- Sistema envía recordatorio

**Flujo:**
```
Sistema: "📍 *Estás cerca de un lugar frecuente*
━━━━━━━━━━━━━━━━━━━━
Estás cerca de: Restaurante XYZ
Última vez: Hace 3 días
Gasto usual: 80 Bs

💡 ¿Vas a gastar aquí? Envía un mensaje para registrarlo."
```

**Beneficio:** Recordatorios contextuales

---

### 📊 Impacto Esperado

- **Análisis de patrones:** Mejor
- **Recordatorios:** Más relevantes

---

## 9. Reacciones para Confirmación

### 🎯 Casos de Uso

#### Caso 1: Confirmación Rápida con Emoji
**Cuándo se activa:**
- Usuario reacciona con 👍 o ✅ al preview
- Sistema confirma automáticamente

**Flujo:**
```
Sistema: "✅ TEXTO PROCESADO
📉 GASTO - 50 Bs
¿Está bien?"
Usuario: [Reacciona con 👍]
Sistema: "✅ Transacción confirmada y guardada"
```

**Beneficio:** Confirmación más rápida

---

### 📊 Impacto Esperado

- **Tiempo de confirmación:** 30 seg → 5 seg
- **Facilidad:** Mayor

---

## 📊 Resumen de Casos de Uso

| Mejora | Casos de Uso | Frecuencia | Impacto |
|--------|--------------|------------|---------|
| **Botones Interactivos** | Confirmación simple/múltiple, corrección | Alta (cada transacción) | ⭐⭐⭐⭐⭐ |
| **Comandos** | Resumen día/semana, límite, categorías | Media (1-2 veces/día) | ⭐⭐⭐⭐ |
| **Plantillas** | Recordatorios, resúmenes, alertas | Baja (1 vez/día o semana) | ⭐⭐⭐⭐ |
| **Lista de Categorías** | Categoría ambigua, corrección | Media (20% transacciones) | ⭐⭐⭐ |
| **OCR** | Comprobantes, facturas, tickets | Media (30% usuarios) | ⭐⭐⭐⭐ |
| **Resúmenes Automáticos** | Diario, semanal, mensual | Baja (1 vez/día/semana) | ⭐⭐⭐ |
| **Quick Replies** | Acciones después de guardar | Alta (cada transacción) | ⭐⭐⭐ |
| **Geotagging** | Ubicación, recordatorios | Baja (10% usuarios) | ⭐⭐ |
| **Reacciones** | Confirmación rápida | Alta (cada transacción) | ⭐⭐⭐ |

---

## 🎯 Recomendaciones por Prioridad

### Prioridad 1: Implementar Primero 🚀
1. **Botones Interactivos** - Impacto inmediato en UX
2. **Comandos Básicos** (`/resumen`, `/limite`) - Funcionalidad sin app
3. **Plantillas para Recordatorios** - Mejora engagement

### Prioridad 2: Implementar Después 📋
4. **Lista de Categorías** - Mejora precisión
5. **OCR para Comprobantes** - Facilita registro
6. **Resúmenes Automáticos** - Mejora retención

### Prioridad 3: Considerar Más Tarde 💡
7. **Quick Replies** - Nice to have
8. **Geotagging** - Funcionalidad avanzada
9. **Reacciones** - Alternativa a botones

---

## 📝 Notas Finales

- **Cada mejora tiene casos de uso específicos** que mejoran la experiencia
- **La priorización depende de:**
  - Frecuencia de uso
  - Impacto en UX
  - Esfuerzo de implementación
  - Necesidades del negocio

- **Recomendación:** Empezar con **Botones Interactivos** y **Comandos Básicos** para impacto inmediato

---

**Documento creado:** 2025-01-21  
**Última actualización:** 2025-01-21

