# 📋 Instrucciones para Ejecutar SQL en Supabase

## ✅ Archivo a Ejecutar

**Archivo:** `supabase-config-matriz.sql`

---

## 🚀 Cómo Ejecutar en Supabase

### Opción 1: SQL Editor en Supabase Dashboard

1. **Ve a tu proyecto en Supabase:** https://supabase.com/dashboard
2. **Abre el SQL Editor** (menú lateral izquierdo)
3. **Copia TODO el contenido de** `supabase-config-matriz.sql`
4. **Pega en el editor SQL**
5. **Click en "Run" o presiona** `Ctrl + Enter`

### Opción 2: Desde Terminal (si tienes CLI)

```bash
# Conectarte a Supabase
supabase link --project-ref dojalqbexsqutfzvfbis

# Ejecutar SQL
supabase db execute -f supabase-config-matriz.sql
```

---

## ⚠️ Nota Importante

**NO copiar código TypeScript** como:
```typescript
import { createClient } from '@supabase/supabase-js';
```

**Solo copiar el SQL** del archivo `supabase-config-matriz.sql`

---

## 📋 Contenido del SQL

El archivo contiene:

1. ✅ Tabla `configuracion_matriz` (base global)
2. ✅ Seed de categorías (10 categorías)
3. ✅ Seed de monedas (8 monedas)
4. ✅ Seed de métodos de pago (6 métodos)
5. ✅ Modificación de `reglas_pais` (agregar columnas)
6. ✅ Tabla `feedback_aprendizaje`
7. ✅ Funciones SQL:
   - `extraer_aprendizaje_de_feedback()`
   - `aplicar_mejoras_feedback()`
   - `obtener_config_completa()`
8. ✅ Vista `estadisticas_feedback`

---

## ✅ Verificación

Después de ejecutar, verifica que se crearon:

```sql
-- Verificar tabla matriz
SELECT * FROM configuracion_matriz LIMIT 5;

-- Verificar que reglas_pais tiene nuevas columnas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'reglas_pais';

-- Verificar tabla feedback_aprendizaje
SELECT * FROM feedback_aprendizaje LIMIT 1;

-- Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'extraer_aprendizaje_de_feedback',
  'aplicar_mejoras_feedback',
  'obtener_config_completa'
);
```

---

## 🎯 Qué Hace Este SQL

1. **Crea configuración matriz** (categorías, monedas, métodos base)
2. **Modifica reglas_pais** para heredar de matriz
3. **Crea sistema de aprendizaje** con tabla `feedback_aprendizaje`
4. **Crea funciones** para aplicar mejoras automáticas
5. **Crea vista** de estadísticas de feedback

---

## ⚙️ Parámetros Modificables

Si quieres cambiar algo antes de ejecutar:

- **Categorías:** Cambiar en las líneas 24-92
- **Monedas:** Cambiar en las líneas 96-151
- **Métodos de pago:** Cambiar en las líneas 155-185

---

## 🔍 Debugging

Si hay errores, revisa:

1. ✅ Tabla `reglas_pais` debe existir
2. ✅ Tabla `usuarios` debe existir
3. ✅ Tabla `predicciones_groq` debe existir
4. ✅ Tabla `feedback_usuarios` debe existir

Si faltan tablas, ejecuta primero:
- `create-feedback-tables.sql`
- `create-admin-table.sql`

---

## ✅ Estado Esperado

Después de ejecutar deberías ver:

```sql
-- Tabla matriz creada
SELECT COUNT(*) FROM configuracion_matriz;
-- Debe dar: ~24 filas (10 categorías + 8 monedas + 6 métodos)

-- Nueva columna en reglas_pais
SELECT hereda_matriz, palabras_adicionales, mejoras_feedback 
FROM reglas_pais 
LIMIT 1;
-- Debe mostrar: hereda_matriz=true, palabras_adicionales={}, mejoras_feedback=0
```

---

## 🎉 Listo

Una vez ejecutado, el sistema de aprendizaje automático estará activo y:

- ✅ Cada país hereda configuración base
- ✅ Se registran errores en `feedback_aprendizaje`
- ✅ Se pueden aplicar mejoras automáticas
- ✅ Se puede consultar estadísticas

