# Solución al Error "Unable to preventDefault inside passive event listener"

## 🐛 Problema
```
Unable to preventDefault inside passive event listener invocation.
```

## 🔍 Causa
Los navegadores modernos marcan los eventos touch como "passive" por defecto para mejorar el rendimiento del scroll. Esto impide usar `preventDefault()` en estos eventos.

## ✅ Solución Implementada

### 1. Separación de Eventos
- **Mouse events**: Pueden usar `preventDefault()` sin problemas
- **Touch events**: NO usan `preventDefault()` para evitar el error

### 2. Funciones Separadas
```typescript
// Para mouse (con preventDefault)
const handleMouseDown = useCallback((event: React.MouseEvent) => {
  event.preventDefault(); // ✅ Funciona
  // ... resto del código
}, []);

// Para touch (sin preventDefault)
const handleTouchStart = useCallback((event: React.TouchEvent) => {
  // No usar preventDefault() aquí ❌
  // ... resto del código
}, []);
```

### 3. Listener Global para Mouse Move
```typescript
useEffect(() => {
  if (isRecording && touchStartX !== null && touchStartY !== null) {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      // Detectar swipe globalmente
    };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
  }
}, [isRecording, touchStartX, touchStartY]);
```

## 🎯 Resultado
- ✅ Sin errores en consola
- ✅ Funcionalidad completa en desktop y móvil
- ✅ Swipe para cancelar funciona en ambos casos
- ✅ Mantener presionado funciona correctamente

## 📱 Compatibilidad
- **Desktop**: Mouse events con preventDefault
- **Mobile**: Touch events sin preventDefault
- **Ambos**: Swipe detection funcional
