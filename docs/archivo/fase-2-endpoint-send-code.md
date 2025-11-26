# ✅ Fase 2 Completada: Endpoint para Enviar Código de Verificación

## 📋 Cambios Realizados

### 1. Endpoint Creado: `POST /api/whatsapp/send-verification-code`

**Ubicación:** `src/app/api/whatsapp/send-verification-code/route.ts`

**Funcionalidad:**
- ✅ Valida teléfono con Zod
- ✅ Verifica que el usuario existe en la base de datos
- ✅ Genera código de 6 dígitos usando `generateVerificationCode()`
- ✅ Guarda código en tabla `codigos_verificacion` con expiración de 10 minutos
- ✅ Manejo de errores robusto
- ✅ Logging para debugging

**Características de seguridad:**
- ✅ No retorna el código en la respuesta (por seguridad)
- ✅ Código expira en 10 minutos
- ✅ Validación de datos con Zod

## ⚠️ Limitación Actual

**El código se genera y guarda, pero NO se envía por WhatsApp aún.**

**Razón:** El worker de Baileys no tiene un endpoint `POST /send` para enviar mensajes.

**Opciones:**
1. **Agregar endpoint en el worker** (requiere modificar el worker)
2. **Usar Meta WhatsApp API** (si está configurado)
3. **Enviar manualmente** (temporal, para pruebas)

## 🧪 Pruebas Recomendadas

### Prueba 1: Verificar que el endpoint funciona
```bash
# En Postman o curl
POST http://localhost:3000/api/whatsapp/send-verification-code
Content-Type: application/json

{
  "phone": "+59176990076"
}
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Código de verificación generado",
  "expiresIn": 600
}
```

### Prueba 2: Verificar que el código se guarda en Supabase
1. Ejecutar el endpoint
2. Ir a Supabase Dashboard → Table Editor → `codigos_verificacion`
3. Verificar que hay un nuevo registro con:
   - `telefono` = el número enviado
   - `codigo` = código de 6 dígitos
   - `usado` = false
   - `expira_en` = fecha futura (10 minutos)

### Prueba 3: Verificar validación
```bash
# Debe fallar con error 400
POST http://localhost:3000/api/whatsapp/send-verification-code
Content-Type: application/json

{
  "phone": ""
}
```

### Prueba 4: Verificar usuario no encontrado
```bash
# Debe fallar con error 404
POST http://localhost:3000/api/whatsapp/send-verification-code
Content-Type: application/json

{
  "phone": "+999999999999"
}
```

## ✅ Checklist de Verificación

- [ ] Endpoint responde correctamente
- [ ] Código se genera (6 dígitos)
- [ ] Código se guarda en `codigos_verificacion`
- [ ] Validación funciona (teléfono requerido)
- [ ] Error 404 si usuario no existe
- [ ] No hay errores en consola del servidor
- [ ] Logs muestran información correcta

## 🔄 Siguiente Paso

**Fase 3: Implementar `sendWhatsAppVerificationCode` en SupabaseContext**
- Llamar al endpoint creado
- Manejar respuesta
- Integrar con el contexto

## 📝 Nota sobre Envío de WhatsApp

El código se genera y guarda correctamente, pero el envío real por WhatsApp requiere:
- Agregar endpoint `POST /send` en el worker de Baileys, O
- Configurar Meta WhatsApp API, O
- Enviar manualmente para pruebas

Por ahora, el código está listo para cuando tengamos la integración de envío.

