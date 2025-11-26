# 📸 Instrucciones para Agregar el Logo de Ahorro365

## 📁 Ubicación del Logo

Coloca tu logo de Ahorro365 en la siguiente ubicación:

```
public/logo.png
```

**Rutas alternativas que también funcionan:**
- `public/images/logo.png`
- `public/logo.svg` (si es formato SVG)
- `public/images/logo.svg` (si es formato SVG)

## ✅ Formatos Soportados

- **PNG** (recomendado): `logo.png`
- **SVG**: `logo.svg`
- **JPG/JPEG**: `logo.jpg` o `logo.jpeg`

## 📐 Tamaño Recomendado

- **Tamaño ideal**: 200x200px o 300x300px
- **Formato**: PNG con fondo transparente (recomendado)
- **Resolución**: Mínimo 96x96px, máximo 512x512px

## 🎯 Dónde se Usa el Logo

El logo se mostrará automáticamente en:

1. **Primer slide del tutorial de onboarding**
   - Reemplaza el icono de gráfico de barras
   - Tamaño: 96x96px

2. **Página de login (`/sign-in`)**
   - Reemplaza el icono de login
   - Tamaño: 96x96px
   - Con sombra para destacar

## 🔄 Fallback Automático

Si el logo no se encuentra en la ruta especificada:
- El sistema mostrará automáticamente el icono por defecto
- No se romperá la aplicación
- Verás un warning en la consola del navegador

## 📝 Pasos para Agregar el Logo

1. **Coloca el archivo del logo** en `public/logo.png`
2. **Verifica el nombre**: Debe ser exactamente `logo.png` (o `logo.svg`)
3. **Reinicia el servidor de desarrollo** si está corriendo:
   ```bash
   npm run dev
   ```
4. **Verifica que funcione**:
   - Abre la página de login → Debe aparecer el logo
   - Crea un usuario nuevo → Debe aparecer el logo en el primer slide del tutorial

## 🎨 Personalización (Opcional)

Si quieres usar una ruta diferente o un nombre diferente, puedes modificar:

1. **En `src/components/OnboardingTutorial.tsx`** (línea ~275):
   ```typescript
   src="/logo.png"  // Cambia por tu ruta
   ```

2. **En `src/app/sign-in/page.tsx`** (línea ~158):
   ```typescript
   src="/logo.png"  // Cambia por tu ruta
   ```

## ✅ Verificación

Después de agregar el logo, deberías ver:

- ✅ Logo en la página de login (en lugar del icono de login)
- ✅ Logo en el primer slide del tutorial (en lugar del icono de gráfico)
- ✅ Los demás slides siguen usando iconos normales

---

**Nota**: Si el logo no aparece, verifica:
1. Que el archivo esté en `public/logo.png`
2. Que el nombre del archivo sea exacto (case-sensitive)
3. Que el formato sea PNG, SVG, JPG o JPEG
4. Reinicia el servidor de desarrollo

