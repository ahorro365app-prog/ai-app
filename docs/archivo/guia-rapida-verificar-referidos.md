# 🚀 Guía Rápida: Verificar Creación de Referidos en Supabase

## 🎯 Objetivo

Encontrar **dónde y cómo se crean los registros en la tabla `referidos`** para integrar el trigger `referral-invited`.

---

## 📍 Paso 1: Revisar Triggers en Tabla `referidos`

**Ruta en Supabase Dashboard:**
```
Database → Tables → referidos → Triggers (pestaña)
```

**Buscar:**
- ✅ Triggers de tipo `AFTER INSERT` o `BEFORE INSERT`
- ✅ Nombre de la función asociada

**Si encuentras algo, anota:**
- Nombre del trigger: `_________________`
- Función asociada: `_________________`

---

## 📍 Paso 2: Revisar Triggers en Tabla `usuarios`

**Ruta en Supabase Dashboard:**
```
Database → Tables → usuarios → Triggers (pestaña)
```

**Buscar:**
- ✅ Triggers de tipo `AFTER INSERT` que puedan crear referidos
- ✅ Funciones que inserten en la tabla `referidos`

**Si encuentras algo, anota:**
- Nombre del trigger: `_________________`
- Función asociada: `_________________`

---

## 📍 Paso 3: Revisar Funciones PostgreSQL

**Ruta en Supabase Dashboard:**
```
Database → Functions
```

**Buscar funciones con nombres como:**
- `crear_referido`
- `procesar_codigo_referido`
- `registrar_referido`
- `handle_referral_code`
- Cualquier función que contenga "referido" o "referral"

**Si encuentras algo, anota:**
- Nombre de la función: `_________________`
- ¿Qué hace? (lee el código SQL): `_________________`

---

## 📍 Paso 4: Verificar Estructura de Tabla `usuarios`

**Ruta en Supabase Dashboard:**
```
Database → Tables → usuarios → Columns
```

**Buscar columna:**
- ✅ ¿Existe `codigo_referido` o `codigo_referido_usado`?
- ✅ ¿Hay algún campo relacionado con códigos de referido?

**Anota:**
- ¿Tiene campo de código de referido? `[ ] SÍ  [ ] NO`
- Nombre del campo: `_________________`

---

## 📝 Reportar Hallazgos

Después de revisar, completa este formato:

```markdown
## ✅ Hallazgos

### Triggers encontrados:
- [ ] Trigger en `referidos`: [NOMBRE] - Función: [NOMBRE]
- [ ] Trigger en `usuarios`: [NOMBRE] - Función: [NOMBRE]

### Funciones encontradas:
- [ ] Función: [NOMBRE]
  - ¿Qué hace?: [DESCRIPCIÓN]

### Estructura:
- [ ] Tabla `usuarios` tiene campo de código de referido: [SÍ/NO]

### Conclusión:
Los referidos se crean mediante: 
[ ] Trigger de base de datos
[ ] Función PostgreSQL
[ ] Código de la aplicación
[ ] No está claro (necesito más información)
```

---

## 🎯 Siguiente Paso

Una vez que tengas esta información, podremos:
1. ✅ Integrar el trigger `referral-invited` en el lugar correcto
2. ✅ Asegurar que las notificaciones se envíen en tiempo real
3. ✅ Documentar el flujo completo

---

## 💡 Tips

- Si no encuentras triggers, probablemente se crean desde el código
- Si encuentras triggers, necesitaremos ver el código SQL de la función
- Puedes copiar el código SQL de las funciones para analizarlo

