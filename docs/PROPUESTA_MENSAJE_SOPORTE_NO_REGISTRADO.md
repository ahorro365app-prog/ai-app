# 💬 Propuesta: Mejorar Mensaje para Usuarios No Registrados

## 📋 SITUACIÓN ACTUAL

**Mensaje actual:**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

¿Quieres que te enviemos la app y poder registrarte? 😊
```

**Problema:**
- El número actual solo es para transacciones
- No hay forma de contactar soporte para registrarse
- Usuario queda sin opciones claras

---

## 🎯 OPCIONES PROPUESTAS

### **OPCIÓN 1: Solo Número de Teléfono**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

¿Quieres que te enviemos la app y poder registrarte? 😊

💬 Para soporte y registro, contáctanos:
   +591 XXXX XXXX
```

**Ventajas:**
- Simple y directo
- Fácil de copiar

**Desventajas:**
- No es clickeable
- Usuario debe copiar y pegar

---

### **OPCIÓN 2: Solo Enlace de WhatsApp (wa.me)**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

¿Quieres que te enviemos la app y poder registrarte? 😊

💬 Para soporte y registro:
   wa.me/591XXXXXXXXX
```

**Ventajas:**
- Clickeable en WhatsApp
- Abre directamente el chat

**Desventajas:**
- Algunos usuarios no saben qué es wa.me
- Puede ser menos claro

---

### **OPCIÓN 3: Ambos (RECOMENDADO)**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

¿Quieres que te enviemos la app y poder registrarte? 😊

💬 Para soporte y registro, contáctanos:
   wa.me/591XXXXXXXXX
   o escribe al +591 XXXX XXXX
```

**Ventajas:**
- Máxima flexibilidad
- Enlace clickeable + número visible
- Cubre todos los casos de uso

**Desventajas:**
- Mensaje un poco más largo

---

### **OPCIÓN 4: Mensaje Más Detallado**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

Este número solo es para registrar transacciones.

💬 Para registrarte o soporte, contáctanos:
   wa.me/591XXXXXXXXX
   o escribe al +591 XXXX XXXX

📱 Te ayudaremos a crear tu cuenta y empezar a ahorrar.
```

**Ventajas:**
- Más informativo
- Explica claramente la diferencia

**Desventajas:**
- Mensaje más largo
- Puede ser demasiado detallado

---

## ❓ PREGUNTAS PARA DECIDIR

1. **¿Tienes un número de WhatsApp de soporte específico?**
   - Si sí, ¿cuál es?
   - Si no, ¿necesitas que lo configuremos como variable de entorno?

2. **¿Prefieres:**
   - Solo número
   - Solo enlace
   - Ambos (recomendado)

3. **¿El mensaje debe ser:**
   - Corto y directo
   - Más detallado y explicativo

4. **¿Quieres mencionar que este número es solo para transacciones?**
   - Sí, para evitar confusión
   - No, mantener simple

---

## 💡 RECOMENDACIÓN ACTUALIZADA

**Opción 3 (Ambos) con incentivo de 14 días gratis:**

### **VERSIÓN 1: Corta y directa**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

Este número solo es para registrar transacciones.

💬 Para registrarte o soporte, contáctanos:
   wa.me/591XXXXXXXXX
   o escribe al +591 XXXX XXXX

🎁 Al registrarte, te damos 14 días gratis para probar la app.
```

### **VERSIÓN 2: Más detallada**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

Este número solo es para registrar transacciones.

💬 Para registrarte o soporte, contáctanos:
   wa.me/591XXXXXXXXX
   o escribe al +591 XXXX XXXX

🎁 Al enviarte la app, te damos 14 días de prueba gratuita para que descubras todas las funcionalidades.
```

### **VERSIÓN 3: Con emoji destacado**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

Este número solo es para registrar transacciones.

💬 Para registrarte o soporte, contáctanos:
   wa.me/591XXXXXXXXX
   o escribe al +591 XXXX XXXX

🎁 ¡Al registrarte te damos 14 días gratis! Prueba la app sin costo.
```

### **VERSIÓN 4: Más comercial**
```
¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

Este número solo es para registrar transacciones.

💬 Para registrarte o soporte, contáctanos:
   wa.me/591XXXXXXXXX
   o escribe al +591 XXXX XXXX

🎁 Al enviarte la app, te regalamos 14 días de prueba gratuita. ¡Empieza a ahorrar hoy mismo!
```

**Razones:**
- ✅ Explica que el número actual es solo para transacciones
- ✅ Proporciona enlace clickeable (fácil acceso)
- ✅ Proporciona número visible (para copiar)
- ✅ Incluye incentivo de 14 días gratis
- ✅ Mensaje claro y con valor agregado

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### **Variable de Entorno:**
```env
WHATSAPP_SUPPORT_NUMBER=+591XXXXXXXXX
```

### **Código:**
```typescript
const supportNumber = process.env.WHATSAPP_SUPPORT_NUMBER || '+59161600190';
const supportLink = `wa.me/${supportNumber.replace(/[^0-9]/g, '')}`;

const message = `¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.

Este número solo es para registrar transacciones.

💬 Para registrarte o soporte, contáctanos:
   ${supportLink}
   o escribe al ${supportNumber}`;
```

---

## 📝 DECISIÓN FINAL

**Por favor, indica:**
1. Número de soporte (o si usar el por defecto)
2. Opción preferida (1, 2, 3 o 4)
3. Cualquier ajuste al mensaje

Una vez decidido, implemento inmediatamente. ✅





