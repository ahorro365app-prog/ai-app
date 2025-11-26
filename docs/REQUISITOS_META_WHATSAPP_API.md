# 📋 Requisitos para Registrar App en Meta WhatsApp API Cloud

**Última actualización:** 19 Nov 2025

---

## 📋 URLs Requeridas en Meta Developer

### ✅ URLs Obligatorias

1. **URL de Política de Privacidad** ⚠️ **REQUERIDA**
   - Meta la verifica
   - Debe ser accesible públicamente
   - Debe estar en el dominio de tu app

2. **URL de Términos del Servicio** ⚠️ **REQUERIDA**
   - Meta la verifica
   - Debe ser accesible públicamente
   - Debe estar en el dominio de tu app

### ⚙️ URLs Opcionales

3. **URL de Eliminación de Datos** (Opcional)
   - Solo si solicitas permisos avanzados
   - Puede dejarse vacío inicialmente

---

## ❓ ¿Puedes Usar las Políticas de Vercel?

### Respuesta: ⚠️ **NO RECOMENDADO**

**Razones:**
1. ❌ Meta verifica que la URL esté en **TU dominio**
2. ❌ Vercel tiene políticas genéricas, no específicas para tu app
3. ❌ Meta puede rechazar si no es específica de tu negocio
4. ⚠️ Puede funcionar temporalmente, pero no es lo ideal

**Recomendación:** Crear páginas básicas en tu propio dominio.

---

## ✅ Solución: Crear Páginas Básicas

### Opción 1: Páginas Mínimas (Recomendado para empezar)

**Ventajas:**
- ✅ Cumple con requisitos de Meta
- ✅ Puedes mejorarlas después
- ✅ Específicas para tu app
- ✅ Fácil de crear

**Contenido mínimo necesario:**
- Nombre de tu app
- Qué datos recopilas
- Cómo usas los datos
- Cómo contactarte

### Opción 2: Usar Generador de Políticas

**Herramientas gratuitas:**
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [TermsFeed](https://www.termsfeed.com/)
- [FreePrivacyPolicy](https://www.freeprivacypolicy.com/)

**Ventajas:**
- ✅ Genera políticas completas
- ✅ Gratis para uso básico
- ✅ Personalizables

---

## 🛠️ Implementación Rápida

### Paso 1: Crear Páginas en tu App

**Estructura sugerida:**
```
src/app/
  ├── privacy/
  │   └── page.tsx      # Política de privacidad
  ├── terms/
  │   └── page.tsx      # Términos del servicio
  └── delete-data/
      └── page.tsx      # Eliminación de datos (opcional)
```

### Paso 2: URLs para Meta

**Ejemplo con tu dominio de Vercel:**
```
https://ahorro365-core-api.vercel.app/privacy
https://ahorro365-core-api.vercel.app/terms
https://ahorro365-core-api.vercel.app/delete-data (opcional)
```

---

## 📝 Contenido Mínimo Requerido

### Política de Privacidad (Mínimo)

**Debe incluir:**
1. ✅ Nombre de la app: "Ahorro365"
2. ✅ Qué datos recopilas: Teléfono, transacciones, etc.
3. ✅ Cómo usas los datos: Procesar transacciones, mejorar servicio
4. ✅ Con quién compartes: No compartes (o especificar)
5. ✅ Cómo contactarte: ahorro365app@gmail.com
6. ✅ Fecha de última actualización

### Términos del Servicio (Mínimo)

**Debe incluir:**
1. ✅ Nombre del servicio: "Ahorro365"
2. ✅ Qué es el servicio: App de gestión de finanzas personales
3. ✅ Uso aceptable: Uso personal, no comercial
4. ✅ Limitaciones: No garantías, uso bajo tu responsabilidad
5. ✅ Cómo contactarte: ahorro365app@gmail.com
6. ✅ Fecha de última actualización

---

## 🚀 Plan de Acción

### Opción A: Páginas Básicas Rápidas (5 minutos)

1. Crear páginas mínimas con contenido básico
2. Deploy a Vercel
3. Usar URLs en Meta
4. Mejorar después si es necesario

**Ventaja:** Rápido, cumple requisitos

### Opción B: Políticas Completas (30 minutos)

1. Usar generador de políticas
2. Personalizar con información de tu app
3. Crear páginas en tu app
4. Deploy a Vercel
5. Usar URLs en Meta

**Ventaja:** Más completo, profesional

---

## ⚠️ Notas Importantes

### Verificación de Meta

**Meta verifica:**
- ✅ Que la URL sea accesible
- ✅ Que esté en tu dominio
- ✅ Que tenga contenido relevante
- ⚠️ Puede rechazar si es muy genérica o vacía

### Dominio

**Importante:**
- Las URLs deben estar en el **mismo dominio** de tu app
- Si tu app está en `ahorro365-core-api.vercel.app`, las políticas deben estar ahí
- No puedes usar `vercel.com/privacy` (no es tu dominio)

### Contenido

**Recomendación:**
- Mínimo: Contenido básico pero específico de tu app
- Ideal: Políticas completas y profesionales
- Evitar: Copiar exactamente de otros sitios sin personalizar

---

## 📋 Checklist para Meta

- [ ] Política de privacidad creada y deployada
- [ ] Términos del servicio creados y deployados
- [ ] URLs accesibles públicamente
- [ ] URLs en el mismo dominio de tu app
- [ ] Contenido específico de tu app (no genérico)
- [ ] Email de contacto incluido
- [ ] Fecha de actualización incluida

---

**Última actualización:** 19 Nov 2025  
**Recomendación:** Crear páginas básicas en tu dominio (5-10 minutos)

