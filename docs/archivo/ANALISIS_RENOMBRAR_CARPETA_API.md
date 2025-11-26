# 📋 Análisis: Renombrar Carpeta API

## ❓ Pregunta del Usuario
¿Renombrar la carpeta `src/app/api/` a `src/app/_api/` traerá complicaciones a futuro, especialmente para correr localhost?

---

## ⚠️ IMPLICACIONES DE RENOMBRAR PERMANENTEMENTE

### ❌ Si renombramos PERMANENTEMENTE a `_api/`:

1. **Desarrollo Local (`npm run dev`) se ROMPE:**
   - ❌ Las rutas API locales (`/api/csrf-token`, `/api/feedback/confirm`, etc.) dejarían de funcionar
   - ❌ Next.js en desarrollo busca rutas en `src/app/api/`, no en `src/app/_api/`
   - ❌ Cualquier código que importe desde `@/app/api/...` fallaría
   - ❌ El desarrollo local quedaría inutilizable

2. **Imports y Referencias:**
   - ❌ Si hay imports como `import { something } from '@/app/api/...'` fallarían
   - ❌ Referencias en código a rutas API locales se romperían

3. **Mantenimiento:**
   - ❌ Confusión para otros desarrolladores
   - ❌ Documentación desactualizada
   - ❌ Errores difíciles de debuggear

### ✅ Si renombramos SOLO TEMPORALMENTE durante el build:

1. **Ventajas:**
   - ✅ Las rutas API funcionan en desarrollo
   - ✅ El build funciona (Next.js ignora `_api/`)
   - ✅ No afecta el desarrollo local

2. **Desventajas:**
   - ⚠️ Requiere recordar renombrar antes de cada build
   - ⚠️ Propenso a errores humanos
   - ⚠️ Si olvidas renombrar, el build falla

---

## 🎯 SOLUCIÓN RECOMENDADA: Script Automático

### Opción A: Script de Node.js (Más Confiable)

Crear un script de Node.js que:
1. Renombre `api/` a `_api/` antes del build
2. Ejecute el build
3. Restaure `_api/` a `api/` después del build
4. Se integre automáticamente en `npm run build`

**Ventajas:**
- ✅ Automático (no requiere recordar nada)
- ✅ Funciona en todos los sistemas operativos
- ✅ No afecta desarrollo local
- ✅ Restaura automáticamente

**Desventajas:**
- ⚠️ Puede fallar si hay procesos con la carpeta abierta
- ⚠️ Requiere cerrar el servidor de desarrollo antes del build

---

## 🔧 IMPLEMENTACIÓN RECOMENDADA

### Script de Node.js para Build

```javascript
// scripts/build-with-api-exclude.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const API_DIR_RENAMED = path.join(process.cwd(), 'src', 'app', '_api');

console.log('🔧 Preparando build para export estático...\n');

// 1. Renombrar api/ a _api/
if (fs.existsSync(API_DIR)) {
  try {
    if (fs.existsSync(API_DIR_RENAMED)) {
      fs.rmSync(API_DIR_RENAMED, { recursive: true, force: true });
    }
    fs.renameSync(API_DIR, API_DIR_RENAMED);
    console.log('✅ Carpeta api/ renombrada a _api/\n');
  } catch (error) {
    console.error('❌ Error renombrando carpeta:', error.message);
    console.error('   Cierra el servidor de desarrollo y cualquier editor que tenga archivos abiertos\n');
    process.exit(1);
  }
}

// 2. Ejecutar build
try {
  console.log('🔄 Ejecutando build...\n');
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  // Restaurar carpeta incluso si el build falla
  if (fs.existsSync(API_DIR_RENAMED)) {
    try {
      fs.renameSync(API_DIR_RENAMED, API_DIR);
      console.log('\n✅ Carpeta api/ restaurada');
    } catch (restoreError) {
      console.error('\n❌ Error restaurando carpeta:', restoreError.message);
    }
  }
  process.exit(1);
}

// 3. Restaurar _api/ a api/
if (fs.existsSync(API_DIR_RENAMED)) {
  try {
    fs.renameSync(API_DIR_RENAMED, API_DIR);
    console.log('\n✅ Carpeta api/ restaurada correctamente\n');
  } catch (error) {
    console.error('\n❌ Error restaurando carpeta:', error.message);
    console.error('   Restaura manualmente: Rename-Item src/app/_api src/app/api\n');
    process.exit(1);
  }
}
```

### Actualizar package.json

```json
{
  "scripts": {
    "build": "node scripts/build-with-api-exclude.js",
    "build:direct": "next build"  // Para builds sin renombrar (si es necesario)
  }
}
```

---

## ✅ CONCLUSIÓN

**NO renombres permanentemente la carpeta.** Esto rompería el desarrollo local.

**Solución recomendada:**
1. ✅ Usar un script automático que renombre temporalmente
2. ✅ Integrarlo en `npm run build`
3. ✅ Restaurar automáticamente después del build
4. ✅ Documentar el proceso

**Beneficios:**
- ✅ Desarrollo local funciona normalmente
- ✅ Build funciona automáticamente
- ✅ No requiere recordar pasos manuales
- ✅ Restaura automáticamente si algo falla

---

**Última actualización:** 2025-01-16

