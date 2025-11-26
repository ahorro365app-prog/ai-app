# 📱 GUÍA: Cambiar el Icono de la App en Android

**Fecha:** 2025-11-17  
**Estado:** ✅ Guía completa

---

## 📋 RESUMEN

Esta guía explica cómo cambiar el icono de la app Ahorro365 cuando se instala en un dispositivo Android.

---

## 🎯 OPCIÓN 1: Usando Capacitor Assets (Recomendado) ⭐⭐⭐⭐⭐

### Ventajas
- ✅ Genera automáticamente todos los tamaños necesarios
- ✅ Crea iconos adaptativos (Android 8.0+)
- ✅ También genera iconos para iOS si es necesario
- ✅ Proceso automatizado

### Pasos

#### 1. Instalar Capacitor Assets

```bash
npm install -D @capacitor/assets
```

#### 2. Preparar la imagen fuente

- **Tamaño recomendado:** 1024x1024px
- **Formato:** PNG (con transparencia si es necesario)
- **Nombre:** `icon.png`
- **Ubicación:** `assets/icon.png` (crear carpeta `assets/` en la raíz)

#### 3. Ejecutar generación de iconos

```bash
npx @capacitor/assets generate
```

Este comando:
- Genera todos los tamaños para Android (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- Crea iconos adaptativos (foreground + background)
- Actualiza los archivos en `android/app/src/main/res/`

#### 4. Sincronizar con Capacitor

```bash
npx cap sync android
```

#### 5. Recompilar APK

```bash
npm run build:apk
```

---

## 🎯 OPCIÓN 2: Manual (Más control) ⭐⭐⭐

### Ventajas
- ✅ Control total sobre cada tamaño
- ✅ Puedes usar diferentes diseños por densidad
- ✅ No requiere herramientas adicionales

### Pasos

#### 1. Preparar la imagen fuente

- **Tamaño:** 1024x1024px (o más grande)
- **Formato:** PNG
- **Fondo:** Transparente o sólido según tu diseño

#### 2. Generar tamaños necesarios

Necesitas crear versiones en estos tamaños:

| Densidad | Tamaño | Carpeta |
|----------|--------|---------|
| mdpi | 48x48px | `mipmap-mdpi/` |
| hdpi | 72x72px | `mipmap-hdpi/` |
| xhdpi | 96x96px | `mipmap-xhdpi/` |
| xxhdpi | 144x144px | `mipmap-xxhdpi/` |
| xxxhdpi | 192x192px | `mipmap-xxxhdpi/` |

**Herramientas para generar tamaños:**
- Online: https://icon.kitchen/ (recomendado)
- Online: https://www.appicon.co/
- Photoshop/GIMP: Exportar en diferentes tamaños
- Script: Ver `scripts/generate-icons.js` (abajo)

#### 3. Reemplazar archivos

Para cada densidad, reemplaza estos archivos:

```
android/app/src/main/res/mipmap-[densidad]/
  ├── ic_launcher.png          ← Icono cuadrado
  ├── ic_launcher_round.png    ← Icono redondo
  └── ic_launcher_foreground.png ← Para iconos adaptativos
```

**Nota:** Si usas iconos adaptativos (Android 8.0+), también necesitas:
- `ic_launcher_foreground.png` - El icono principal (sin fondo)
- Configurar el fondo en `drawable/ic_launcher_background.xml`

#### 4. Actualizar icono web (opcional)

También actualiza el icono para la web:

```bash
# Reemplazar
public/app-icon.png
```

#### 5. Recompilar APK

```bash
npm run build:apk
```

---

## 🎯 OPCIÓN 3: Usando Script Automático ⭐⭐⭐⭐

### Script para generar todos los tamaños

Crea `scripts/generate-icons.js`:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
};

const sourceIcon = path.join(__dirname, '../assets/icon.png');
const outputDir = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  console.log('🎨 Generando iconos para Android...\n');
  
  // Verificar que existe el icono fuente
  if (!fs.existsSync(sourceIcon)) {
    console.error(`❌ Error: No se encontró ${sourceIcon}`);
    console.error('   Crea una imagen de 1024x1024px en assets/icon.png');
    process.exit(1);
  }
  
  // Generar para cada densidad
  for (const [density, size] of Object.entries(sizes)) {
    const mipmapDir = path.join(outputDir, `mipmap-${density}`);
    
    // Crear directorio si no existe
    if (!fs.existsSync(mipmapDir)) {
      fs.mkdirSync(mipmapDir, { recursive: true });
    }
    
    // Generar ic_launcher.png
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(mipmapDir, 'ic_launcher.png'));
    
    // Generar ic_launcher_round.png (mismo tamaño)
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(mipmapDir, 'ic_launcher_round.png'));
    
    // Generar ic_launcher_foreground.png (para iconos adaptativos)
    await sharp(sourceIcon)
      .resize(size, size)
      .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));
    
    console.log(`✅ Generado ${density}: ${size}x${size}px`);
  }
  
  console.log('\n✅ Todos los iconos generados exitosamente!');
  console.log('💡 Ahora ejecuta: npm run build:apk\n');
}

generateIcons().catch(console.error);
```

**Instalar dependencia:**
```bash
npm install -D sharp
```

**Agregar script en package.json:**
```json
{
  "scripts": {
    "generate:icons": "node scripts/generate-icons.js"
  }
}
```

**Usar:**
```bash
# 1. Coloca tu icono en assets/icon.png (1024x1024px)
# 2. Ejecuta el script
npm run generate:icons
# 3. Recompila
npm run build:apk
```

---

## 📐 ESPECIFICACIONES TÉCNICAS

### Iconos Adaptativos (Android 8.0+)

Android 8.0+ usa iconos adaptativos que consisten en:
- **Foreground:** El icono principal (centrado, 432x432px en un canvas de 108x108dp)
- **Background:** Color o imagen de fondo

**Archivos importantes:**
- `mipmap-anydpi-v26/ic_launcher.xml` - Define el icono adaptativo
- `drawable-v24/ic_launcher_foreground.xml` - Foreground vectorial (opcional)
- `drawable/ic_launcher_background.xml` - Background (color o imagen)

### Tamaños por Densidad

| Densidad | DPI | Tamaño Launcher | Tamaño Foreground |
|----------|-----|-----------------|-------------------|
| mdpi | 160 | 48x48px | 108x108dp |
| hdpi | 240 | 72x72px | 162x162dp |
| xhdpi | 320 | 96x96px | 216x216dp |
| xxhdpi | 480 | 144x144px | 324x324dp |
| xxxhdpi | 640 | 192x192px | 432x432dp |

---

## 🎨 DISEÑO DEL ICONO

### Recomendaciones

1. **Tamaño fuente:** 1024x1024px mínimo
2. **Formato:** PNG con transparencia
3. **Zona segura:** Mantén contenido importante dentro del 80% central
4. **Fondo:** Puede ser transparente o sólido
5. **Estilo:** Simple y reconocible en tamaños pequeños

### Herramientas de Diseño

- **Figma:** Gratis, excelente para diseño
- **Adobe Illustrator:** Profesional
- **Canva:** Fácil de usar
- **GIMP:** Gratis, open source

### Herramientas Online para Generar

- **Icon Kitchen:** https://icon.kitchen/ (recomendado)
- **App Icon Generator:** https://www.appicon.co/
- **MakeAppIcon:** https://makeappicon.com/

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-hdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-anydpi-v26/
│   ├── ic_launcher.xml
│   └── ic_launcher_round.xml
├── drawable/
│   └── ic_launcher_background.xml
└── drawable-v24/
    └── ic_launcher_foreground.xml
```

---

## 🔧 CONFIGURACIÓN ACTUAL

### AndroidManifest.xml

```xml
<application
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    ...>
```

### Iconos Adaptativos

Los iconos adaptativos están configurados en:
- `mipmap-anydpi-v26/ic_launcher.xml`
- `mipmap-anydpi-v26/ic_launcher_round.xml`

Estos archivos referencian:
- Background: `@color/ic_launcher_background` o `@drawable/ic_launcher_background`
- Foreground: `@mipmap/ic_launcher_foreground`

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de compilar:

- [ ] Icono fuente preparado (1024x1024px mínimo)
- [ ] Todos los tamaños generados (5 densidades)
- [ ] Archivos colocados en carpetas correctas
- [ ] Icono web actualizado (opcional)
- [ ] Iconos adaptativos configurados (si aplica)
- [ ] APK recompilado
- [ ] Icono visible en dispositivo de prueba

---

## 🚀 PASOS RÁPIDOS (Resumen)

### Opción Rápida (Capacitor Assets):

```bash
# 1. Instalar
npm install -D @capacitor/assets

# 2. Colocar icono en assets/icon.png (1024x1024px)

# 3. Generar
npx @capacitor/assets generate

# 4. Sincronizar
npx cap sync android

# 5. Compilar
npm run build:apk
```

### Opción Manual:

1. Generar tamaños con https://icon.kitchen/
2. Reemplazar archivos en `android/app/src/main/res/mipmap-*/`
3. Recompilar: `npm run build:apk`

---

## 📝 NOTAS IMPORTANTES

1. **Limpieza de caché:** Si el icono no cambia, limpia el caché:
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Desinstalar app anterior:** Desinstala la app del dispositivo antes de instalar la nueva versión

3. **Verificar en dispositivo:** El icono puede verse diferente en el emulador vs dispositivo real

4. **Iconos adaptativos:** Android 8.0+ usa iconos adaptativos automáticamente si están configurados

---

## 🐛 TROUBLESHOOTING

### El icono no cambia después de recompilar

**Solución:**
1. Limpiar build: `cd android && ./gradlew clean`
2. Desinstalar app del dispositivo
3. Recompilar: `npm run build:apk`
4. Reinstalar en dispositivo

### El icono se ve pixelado

**Solución:**
- Asegúrate de usar una imagen fuente de alta resolución (1024x1024px mínimo)
- Verifica que todos los tamaños estén generados correctamente

### El icono no es redondo en algunos dispositivos

**Solución:**
- Android 8.0+ usa iconos adaptativos automáticamente
- Verifica que `ic_launcher_round.png` esté en todas las densidades
- Algunos launchers personalizados pueden mostrar iconos cuadrados

---

**Última actualización:** 2025-11-17

