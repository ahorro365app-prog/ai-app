# 📋 ESPECIFICACIÓN CONSOLIDADA: Planes de Suscripción

## ✅ RESPUESTAS CONFIRMADAS

### 1. Plan FREE - Duración de 14 días ✅
- **Después de 14 días:** Se convierte automáticamente a estado "caducado" (3 transacciones/día)
- **Notificación:** Sí, se le notifica que debe actualizar a Smart/Pro/Elite
- **Funcionalidades después de 14 días:** Limitado a solo 3 transacciones por día

### 2. Plan SMART - Sistema de Referidos ✅
- **Código único:** Se genera automáticamente cuando solicita verificar WhatsApp
- **Código para referir:** Único por usuario, se habilita después de verificar WhatsApp
- **Personas referidas:** Pueden ser usuarios existentes o nuevos, pero que NO se hayan referido con nadie antes
- **Ganar Smart solo una vez:** Solo se puede ganar los 14 días por referir UNA SOLA VEZ, no se acumula
- **Requisito para calificar:** Si refiere 5 personas pero no todas verifican, NO califica. Deben ser 5 personas referidas Y verificadas
- **Conteo de referidos:** Solo se usa una vez por cuenta (no acumulativo)
- **Referir más de 5:** Puede referir más de 5 personas, pero solo cuenta para los 14 días (no se duplican los días)

**Verificación WhatsApp:**
- **Cómo funciona:** Se envía un código único por WhatsApp 
- **Si no verifica:** No puede ganar los 14 días del plan Smart
- **Cambio de número:** Puede cambiar su número después de verificar, pero:
  - No puede volver a cambiar dentro de mínimo 30 días
  - Si ya refirió personas antes, NO puede volver a referir después de cambiar

### 3. Plan PRO - WhatsApp ✅
- **Corrección:** WhatsApp es ILIMITADO (no hay límite de 5)

### 4. Estado CADUCADO ✅
- **Deudas:** Puede VER sus deudas guardadas pero NO puede hacer ninguna ejecución (crear, editar, pagar, eliminar)
- **Metas:** Puede VER sus metas guardadas pero NO puede hacer ninguna ejecución (crear, editar, actualizar, eliminar)

---

## ❓ PREGUNTAS PENDIENTES DE RESOLVER

### 4. **Planes PRO y ELITE - Características no especificadas**
❓ **Presupuestos por categoría:**
nunca hemos hablao de presupuesto por cateforia a que se refiere
- ¿En qué plan se habilita? ¿Pro y Elite, o solo Elite?
- ¿Es diferente entre Pro y Elite? ¿Qué significa "avanzados" en Elite?

❓ **Reportes:**
tampoco hemos hablado de esto a que se refiere
- ¿En Elite los reportes son con IA avanzada/predictivos?
- ¿Qué diferencia hay entre "completos" (Free/Smart/Pro) e "IA avanzada" (Elite)?

❓ **Recordatorios:**
nunca hemos hablao de recordatorios por cateforia a que se refiere
- ¿En Elite son "avanzados" y "personalizados"?
- ¿Qué diferencia hay entre recordatorios normales y avanzados?

### 5. **Estado CADUCADO** (Preguntas adicionales)
❓ **Funcionalidades disponibles:**
- ¿Pueden seguir viendo sus datos históricos? (transacciones pasadas, reportes históricos)
solo podra ver hasta de las 4 ultimas semanas
- ¿Pueden exportar sus datos?
no
- ¿Qué otras funcionalidades quedan bloqueadas además de deudas y metas?
ninguna por ahora
- ¿Pueden actualizar su perfil/configuración?
si claro
- ¿Pueden ver reportes/análisis históricos?
si claro
- ¿WhatsApp disponible? ¿Voz disponible?
hasta 3 transaacciones por dia

### 6. **Sistema de Pagos (PRO y ELITE)**
❓ **Preguntas sobre suscripciones de pago:**
- ¿Son suscripciones mensuales o anuales?
mensuales
- ¿Hay descuento por pago anual?
aun no lo hemos revisado suscrpcion semestral y anual
- ¿Cómo se maneja el pago? (Stripe, PayPal, transferencia, otros)
lo vamos a revisar deacuerdo al pais pero todos tendran usdt de binance (creo que seria una buena alternativa)
- ¿Qué pasa si un usuario no paga? ¿Se convierte automáticamente a "caducado"?
exacto
- ¿Hay período de gracia antes de caducar?
no
- ¿Pueden cancelar en cualquier momento y conservar hasta el final del período pagado?
claro que si

### 7. **Migración de Usuarios Existentes**
❓ **Usuarios con 'premium' actual:**
- ¿Migramos a 'pro' automáticamente?
- ¿Migramos a 'elite' automáticamente?
- ¿Los dejamos en 'premium' y creamos un mapeo temporal?
si todos a premium
❓ **Usuarios con 'free' actual:**
- ¿Cuándo empezamos a contar los 14 días? ¿Desde el registro original o desde la migración?
no tenemos
- ¿Los usuarios que ya tienen más de 14 días registrados, qué les pasa? ¿Quedan automáticamente en "caducado"?
no tenemos 

### 8. **Campos de Base de Datos Necesarios**
❓ **Necesitamos definir:**
- `suscripcion`: 'free', 'smart', 'pro', 'elite' ✅ (ya definido)
- `fecha_expiracion_suscripcion`: ¿TIMESTAMP? ¿NULL si es ilimitado? ¿Cómo manejamos Free/Smart que tienen 14 días?
- `fecha_registro`: ¿Ya existe? Para calcular los 14 días de Free solo para los nuevos
- `whatsapp_verificado`: ¿BOOLEAN? Para verificar si puede acceder a Smart 
- `codigo_referido`: ¿TEXT? Código único para referir personas (¿se genera al verificar WhatsApp?)
- `referidos_verificados`: ¿INTEGER? Contador de referidos que verificaron
- `referido_de`: ¿TEXT/UUID? Para saber quién referió a este usuario
- `ha_ganado_smart`: ¿BOOLEAN? Para saber si ya ganó Smart (solo una vez)
- `suscripcion_anterior`: ¿TEXT? Para trackear downgrades
- `fecha_ultima_renovacion`: ¿TIMESTAMP? Para planes recurrentes
- `fecha_ultimo_cambio_telefono`: ¿TIMESTAMP? Para validar el mínimo de 30 días entre cambios

### 9. **Validación de Límites**
❓ **Preguntas técnicas:**
- ¿Los límites se validan en el frontend, backend, o ambos?
veelo tu lo mejor 
- ¿Qué pasa si un usuario tiene 5 deudas en Pro y elimina una, puede crear otra inmediatamente?
solo pasando 10 dias
- ¿Cómo contamos "transacciones por día" en estado caducado? ¿Por fecha local del usuario (zona horaria del país)?
zona horaria del pais
- ¿Cómo validamos que un referido "verificó su WhatsApp"? ¿Se marca automáticamente cuando verifica o requiere acción del admin?
marca automaticamente
- ¿Cómo validamos que un usuario "no se ha referido con nadie"? ¿Necesitamos campo `referido_de`?
no estan obligados a referirse con alguien simplemente es una opcion para que el que refiere gane los dias extra
### 10. **Lógica de Expiración**
❓ **Preguntas sobre caducidad:**
- ¿Los 14 días de Free/Smart se cuentan en días calendario o días activos? (ej: si se registra el 1 de enero, caduca el 15 de enero, o solo cuenta días que usa la app)
desde el dia que se registra 
- ¿Qué pasa si un usuario está en Smart y caduca? ¿Vuelve automáticamente a "caducado" o hay alguna transición?
vuelve directo a caduda y solo puede hacer la migracion a pro o elite
- ¿Un usuario en Pro/Elite que no paga, inmediatamente va a "caducado" o hay período de gracia?
va de inmediato a caducado
- ¿Los usuarios pueden tener múltiples períodos de Smart si siguen refiriendo? (Ya respondiste que NO, solo una vez)
solo una vez
- ¿Si un usuario ya ganó Smart una vez, puede seguir refiriendo personas pero sin beneficio adicional?
puede (adelante podriamos dar insentivos adicionales a los que refieren 10 , 20 o 30 aun no definido)
---

## 🔄 FLUJOS QUE NECESITAMOS DEFINIR COMPLETAMENTE

### Flujo 1: Nuevo Usuario → Free → Smart
1. ✅ Usuario se registra → Plan: FREE, `fecha_registro`: hoy
2. ✅ Después de 14 días → Se convierte automáticamente a "caducado" (3 transacciones/día)
3. ❓ Usuario solicita verificar WhatsApp → ¿Cómo se solicita? ¿Botón en perfil?
4. ❓ Sistema envía código por WhatsApp → ¿Cómo se envía? ¿Usando el sistema de WhatsApp existente?
5. ❓ Usuario ingresa código → ¿Se verifica automáticamente?
6. ❓ Después de verificar → ¿Se genera automáticamente su `codigo_referido`?
7. ❓ Usuario comparte código con 5 personas → ¿Cómo comparte? ¿Copia/pega? ¿Link?
8. ❓ Nueva persona se registra usando código → ¿Dónde ingresa el código? ¿En registro?
9. ❓ Nueva persona verifica WhatsApp → ¿Se cuenta automáticamente como referido verificado del referidor?
10. ❓ Cuando llega a 5 referidos verificados → ¿Se habilita Smart automáticamente?
11. ❓ ¿Cuándo empiezan los 14 días de Smart? ¿Desde que completa las 5 referencias o desde que verifica WhatsApp?

### Flujo 2: Upgrade a PRO/ELITE
1. ❓ Usuario en Free/Smart/Caducado quiere upgrade a Pro/Elite
2. ❓ ¿Ve una página de comparación de planes?
3. ❓ ¿Cómo paga? ¿Página de pago integrada? ¿Redirección externa?
4. ❓ ¿Se procesa el pago inmediatamente?
5. ❓ ¿Se actualiza el plan inmediatamente o hay confirmación?
6. ❓ ¿Qué pasa si el pago falla?
7. ❓ ¿Cómo se renueva? ¿Automático mensual? ¿Se cobra automáticamente?

### Flujo 3: Downgrade o Caducidad
1. ❓ Usuario en Pro/Elite no renueva pago
2. ❓ ¿Cuándo caduca exactamente? ¿El día que vence el pago o hay período de gracia?
3. ❓ ¿Se le notifica antes de caducar? ¿Cuántos días antes?
4. ❓ ¿Qué pasa con sus datos? ¿Se bloquean o solo se limitan funcionalidades?
5. ❓ ¿Puede volver a activar Pro/Elite después de caducar pagando de nuevo?

### Flujo 4: Sistema de Referidos (Detalle técnico)
1. ✅ Usuario verifica WhatsApp → Se genera código automáticamente
2. ❓ ¿El código es un UUID corto o un código alfanumérico legible? (ej: "AHORRO-ABC123" o "a3b5c7d9")
a3b5c7d9
3. ❓ ¿El código es único globalmente o solo único por usuario?
4. ❓ Usuario comparte código con otra persona → ¿Cómo se comparte? (WhatsApp, email, link)
5. ❓ Nueva persona se registra usando código → ¿Dónde ingresa el código? ¿En el formulario de registro?
6. ❓ ¿Cómo validamos que el código es válido y que el usuario no se ha referido antes?
7. ❓ Nueva persona verifica WhatsApp → ¿Se cuenta automáticamente como referido verificado?
8. ❓ ¿El referidor recibe notificación cuando alguien verifica usando su código?
9. ❓ ¿El referidor puede ver cuántas personas ha referido y cuántas han verificado?

---

## 📊 MATRIZ DE COMPARACIÓN ACTUALIZADA

| Característica | Free | Smart | Pro | Elite | Caducado |
|---------------|------|-------|-----|-------|----------|
| **Duración** | 14 días desde registro | 14 días (verificar + 5 ref verificados) | Pago mensual | Pago mensual | Ilimitado |
| **Transacciones** | Ilimitadas | Ilimitadas | Ilimitadas | Ilimitadas | 3/día |
| **Deudas activas** | 1 | 1 | 5 | Ilimitado | ❌ Ver solo |
| **Metas activas** | 1 | 1 | 5 | Ilimitado | ❌ Ver solo |
| **WhatsApp** | ✅ Sí, ilimitado | ✅ Sí, ilimitado | ✅ Sí, ilimitado | ✅ Sí, ilimitado | ❓ ¿Sí/No? |
| **Voz** | ✅ Sí, ilimitado | ✅ Sí, ilimitado | ✅ Sí, ilimitado | ✅ Sí, ilimitado | ❓ ¿Sí/No? |
| **Reportes** | ✅ Completos | ✅ Completos | ✅ Completos | ❓ IA Avanzada? | ❓ ¿Sí/No? |
| **Exportación** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Todos formatos | ❓ ¿Sí/No? |
| **Categorías personalizadas** | ❓ | ❓ | ✅ Ilimitadas | ✅ Ilimitadas | ❓ |
| **Presupuestos por categoría** | ❌ | ❌ | ❓ | ❓ | ❌ |
| **Recordatorios** | ❓ | ✅ Sí | ✅ Sí | ❓ Avanzados? | ❓ |
| **Backup automático** | ❌ | ❌ | ✅ Sí | ✅ Sí | ❌ |
| **Soporte** | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí | ❓ ¿Sí/No? |
| **Precio/mes** | $0 | $0 (5 ref) | $2.99 USD | $4.99 USD | - |
| **Requisito** | Registro | Verificar WhatsApp + 5 ref verificados | Pago | Pago | Ninguno (caducado) |

---

## 🎯 ESTADO ACTUAL

### ✅ COMPLETADO
- [x] Definir planes básicos (Free, Smart, Pro, Elite)
- [x] Definir límites básicos de cada plan
- [x] Definir lógica de expiración de Free (14 días → caducado)
- [x] Definir sistema de referidos básico (5 personas verificadas)
- [x] Definir que Smart solo se gana una vez
- [x] Definir estado caducado para deudas/metas (ver solo, no ejecutar)

### ❓ PENDIENTE
- [ ] Responder preguntas de secciones 4, 5, 6, 7, 8, 9, 10
- [ ] Definir flujos completos de usuario
- [ ] Definir campos exactos de base de datos
- [ ] Definir sistema de pagos
- [ ] Definir estrategia de migración
- [ ] Definir lógica técnica de validación

---

## 📝 SIGUIENTE PASO

**Por favor, responde las preguntas pendientes en las secciones 4-10 para poder comenzar la implementación completa.**
