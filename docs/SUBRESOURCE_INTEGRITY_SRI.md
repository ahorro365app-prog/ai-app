# 🔒 Subresource Integrity (SRI)

Esta guía explica cómo implementar Subresource Integrity (SRI) para recursos externos.

## 📋 ¿Qué es SRI?

SRI es una característica de seguridad que permite verificar que los recursos cargados desde CDNs no han sido modificados. Usa hashes criptográficos para validar la integridad.

## ✅ Estado Actual

### Recursos Externos Identificados

1. **Google Fonts** (en `src/app/globals.css`):
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
   ```

2. **Next.js Fonts** (en `src/app/layout.tsx`):
   - `Geist` y `Geist_Mono` de `next/font/google`
   - ✅ **Seguro**: Next.js maneja estas fuentes internamente, no requieren SRI

### Recursos que NO requieren SRI

- Fuentes cargadas vía `next/font/google` (Next.js las optimiza y sirve localmente)
- Recursos del mismo origen
- Recursos de Supabase (mismo dominio o subdominio confiable)

## 🔧 Implementación de SRI

### Para Google Fonts (CSS)

Cuando uses Google Fonts directamente (no recomendado, mejor usar `next/font`):

```html
<link 
  rel="stylesheet" 
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
  integrity="sha384-..."
  crossorigin="anonymous"
/>
```

**Generar hash SRI**:
```bash
# Instalar herramienta (si no está instalada)
npm install -g sri-hash

# Generar hash para un recurso
sri-hash https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap
```

### Para Scripts Externos

Si en el futuro necesitas cargar scripts externos:

```html
<script 
  src="https://example.com/script.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

## 🎯 Recomendación Actual

### ✅ Mejor Práctica: Usar Next.js Fonts

En lugar de cargar Google Fonts directamente, usa `next/font/google`:

```typescript
// ✅ RECOMENDADO (ya implementado)
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
});
```

**Ventajas**:
- Next.js descarga y optimiza las fuentes
- Se sirven desde el mismo origen (no requiere SRI)
- Mejor performance (self-hosted)
- No requiere conexión externa en runtime

### ⚠️ Si necesitas cargar recursos externos en el futuro

1. **Generar hash SRI**:
   ```bash
   curl -s https://example.com/resource.js | openssl dgst -sha384 -binary | openssl base64 -A
   ```

2. **Agregar integrity y crossorigin**:
   ```html
   <script 
     src="https://example.com/resource.js"
     integrity="sha384-<hash-generado>"
     crossorigin="anonymous"
   ></script>
   ```

3. **Verificar que funciona**:
   - El navegador validará el hash automáticamente
   - Si el recurso cambia, el navegador rechazará la carga

## 📝 Checklist para Nuevos Recursos Externos

Cuando agregues un nuevo recurso externo:

- [ ] ¿Es realmente necesario cargarlo externamente?
- [ ] ¿Puede ser self-hosted o servido desde el mismo origen?
- [ ] Si debe ser externo, generar hash SRI
- [ ] Agregar atributos `integrity` y `crossorigin="anonymous"`
- [ ] Probar que el recurso carga correctamente
- [ ] Documentar en este archivo

## 🔮 Recursos Futuros que Podrían Requerir SRI

1. **Analytics scripts** (si se agregan):
   - Google Analytics
   - Facebook Pixel
   - etc.

2. **Widgets externos**:
   - Chat widgets
   - Mapas (Google Maps, etc.)
   - Calendarios

3. **Librerías de terceros**:
   - Solo si se cargan desde CDN
   - Preferir instalación vía npm cuando sea posible

## 📚 Recursos

- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [W3C SRI Specification](https://www.w3.org/TR/SRI/)
- [SRI Hash Generator](https://www.srihash.org/)

---

**Última actualización**: 2025-01-18  
**Estado**: ✅ No se requieren cambios inmediatos - Next.js Fonts ya maneja fuentes de forma segura


