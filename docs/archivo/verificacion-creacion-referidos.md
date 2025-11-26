# 🔍 Guía para Verificar Creación de Referidos en Supabase

## 📋 Objetivo

Verificar cómo se crean los registros en la tabla `referidos` cuando un usuario se registra con un código de referido. Esto nos permitirá integrar el trigger `referral-invited` en el lugar correcto.

---

## 🔍 Paso 1: Verificar Triggers en la Tabla `referidos`

### Ubicación en Supabase Dashboard:
1. Ve a **Database** → **Triggers**
2. Busca triggers relacionados con la tabla `referidos`
3. Específicamente busca:
   - Triggers que se ejecuten en `INSERT` en la tabla `referidos`
   - Triggers que se ejecuten en `INSERT` en la tabla `usuarios` (que puedan crear referidos)

### ¿Qué buscar?

**Triggers en tabla `referidos`:**
- Nombre del trigger (ej: `trigger_crear_referido`, `trigger_referido_invitado`, etc.)
- Evento: `AFTER INSERT` o `BEFORE INSERT`
- Función asociada

**Triggers en tabla `usuarios`:**
- Nombre del trigger (ej: `trigger_crear_referido_al_registrar`, etc.)
- Evento: `AFTER INSERT`
- Función que inserte en `referidos`

### 📝 Anotar:
- [ ] ¿Hay triggers en la tabla `referidos`?
- [ ] ¿Hay triggers en la tabla `usuarios` que creen referidos?
- [ ] Nombres de los triggers encontrados
- [ ] Funciones asociadas a cada trigger

---

## 🔍 Paso 2: Verificar Funciones de Base de Datos

### Ubicación en Supabase Dashboard:
1. Ve a **Database** → **Functions**
2. Busca funciones relacionadas con referidos

### Funciones a buscar:
- Funciones que contengan `referido`, `referral`, `codigo_referido` en el nombre
- Funciones que inserten en la tabla `referidos`
- Funciones que se ejecuten al crear un usuario

### Ejemplos de nombres posibles:
- `crear_referido`
- `procesar_codigo_referido`
- `registrar_referido`
- `actualizar_contador_referidos` (ya la conocemos, pero verificar si también crea)

### 📝 Anotar:
- [ ] ¿Hay funciones que creen referidos?
- [ ] Nombres de las funciones encontradas
- [ ] Código de las funciones (copiar el SQL)

---

## 🔍 Paso 3: Verificar Estructura de la Tabla `referidos`

### Ubicación en Supabase Dashboard:
1. Ve a **Database** → **Tables** → `referidos`
2. Revisa la estructura de la tabla
3. Ve a la pestaña **Triggers** dentro de la tabla

### Verificar:
- Columnas de la tabla
- Si hay algún trigger listado en la pestaña **Triggers**
- Si hay alguna política RLS que pueda afectar la creación

### 📝 Anotar:
- [ ] Estructura de columnas de `referidos`
- [ ] Triggers listados en la tabla
- [ ] Políticas RLS (si aplica)

---

## 🔍 Paso 4: Verificar Estructura de la Tabla `usuarios`

### Ubicación en Supabase Dashboard:
1. Ve a **Database** → **Tables** → `usuarios`
2. Revisa la estructura de la tabla
3. Ve a la pestaña **Triggers** dentro de la tabla

### Verificar:
- Si hay un campo `codigo_referido` o similar
- Triggers que se ejecuten al crear un usuario
- Funciones que se ejecuten cuando se inserta un usuario

### 📝 Anotar:
- [ ] ¿Hay campo `codigo_referido` en `usuarios`?
- [ ] Triggers en la tabla `usuarios` relacionados con referidos
- [ ] Funciones asociadas

---

## 🔍 Paso 5: Buscar en el Código de la App

### Si NO hay triggers en Supabase:

Significa que la creación de referidos se hace desde el código de la aplicación. Buscar:

1. **En `createUser`** (`src/contexts/SupabaseContext.tsx`):
   - ¿Acepta un parámetro `codigoReferido`?
   - ¿Inserta en la tabla `referidos` después de crear el usuario?

2. **En endpoints de API**:
   - Buscar endpoints que manejen registro de usuarios
   - Buscar endpoints que manejen códigos de referido

3. **En el formulario de registro** (`src/app/sign-up/page.tsx`):
   - ¿Hay un campo para código de referido?
   - ¿Se envía el código al crear el usuario?

---

## 📝 Formato para Reportar Hallazgos

Por favor, completa este formato después de revisar:

```markdown
## ✅ Hallazgos en Supabase

### Triggers encontrados:
- [ ] Trigger en tabla `referidos`: [NOMBRE] - [EVENTO] - [FUNCIÓN]
- [ ] Trigger en tabla `usuarios`: [NOMBRE] - [EVENTO] - [FUNCIÓN]

### Funciones encontradas:
- [ ] Función: [NOMBRE] - [DESCRIPCIÓN]
  - Código SQL: [PEGAR AQUÍ]

### Estructura de tablas:
- [ ] Tabla `referidos`: [COLUMNAS RELEVANTES]
- [ ] Tabla `usuarios`: [¿TIENE codigo_referido?]

### Conclusión:
- [ ] Los referidos se crean mediante: [TRIGGER/FUNCIÓN/CÓDIGO]
- [ ] Ubicación exacta: [DÓNDE SE CREA]
```

---

## 🎯 Siguiente Paso

Una vez que identifiquemos **dónde se crean los referidos**, podremos:

1. **Si es un trigger de DB**: Crear una función PostgreSQL que invoque el endpoint `/api/notifications/triggers/referral-invited`
2. **Si es código**: Integrar la invocación del trigger después de insertar en `referidos`
3. **Si no existe**: Implementar la creación de referidos e integrar el trigger

---

## ⚠️ Notas Importantes

- Los triggers de base de datos pueden usar extensiones como `pg_net` o `http` para hacer llamadas HTTP
- Si hay un trigger, necesitaremos verificar si tiene permisos para hacer llamadas HTTP externas
- El cron job seguirá funcionando como red de seguridad incluso si no integramos en tiempo real

