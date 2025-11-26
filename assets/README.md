# 📁 Assets para Iconos y Splash Screens

Esta carpeta contiene los archivos fuente para generar los iconos y splash screens de la app.

## 📋 Archivos Necesarios

### Icono de la App
- **Archivo:** `icon.png`
- **Tamaño:** 1024x1024px (mínimo)
- **Formato:** PNG
- **Fondo:** Transparente o sólido (recomendado: transparente)

### Splash Screen (Opcional)
- **Archivo:** `splash.png`
- **Tamaño:** 2732x2732px
- **Formato:** PNG
- **Fondo:** Sólido (se recomienda el color de la app)

## 🚀 Uso

### Generar Iconos

```bash
# Generar todos los iconos (Android + iOS si está configurado)
npm run generate:icons

# Solo Android
npm run generate:icons:android
```

### Después de Generar

```bash
# Sincronizar con Capacitor
npx cap sync android

# Recompilar APK
npm run build:apk
```

## 📐 Especificaciones Técnicas

### Icono
- **Tamaño fuente:** 1024x1024px
- **Zona segura:** Mantén contenido importante dentro del 80% central
- **Estilo:** Simple y reconocible en tamaños pequeños

### Colores de Fondo
- **Claro:** `#ffffff` (blanco)
- **Oscuro:** `#000000` (negro)

Estos colores se usan para iconos adaptativos en Android 8.0+.

## 📝 Notas

- Los iconos generados se colocan automáticamente en `android/app/src/main/res/mipmap-*/`
- No modifiques manualmente los archivos generados
- Si cambias el icono, vuelve a ejecutar `npm run generate:icons`

