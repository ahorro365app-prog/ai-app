# 🔧 Solución: Bucle Infinito de Recarga

**Fecha:** 2025-01-16  
**Problema detectado durante:** Fase 6 - Pruebas en Dispositivo

---

## 🐛 PROBLEMA

### Síntoma:
La app se recarga infinitamente cuando se abre en modo "device" de Chrome DevTools, como si algo estuviera presionando F5 constantemente.

### Causa Raíz:
El `useEffect` en `src/app/page.tsx` ejecutaba `window.location.replace()` **siempre**, sin verificar:
1. Si ya estábamos en la ruta correcta
2. Si ya habíamos redirigido antes
3. Si estábamos en una ruta diferente a la raíz

Esto causaba un bucle infinito:
- Componente se monta → `useEffect` ejecuta → `window.location.replace()` → Página se recarga → Componente se monta de nuevo → Bucle infinito

---

## ✅ SOLUCIÓN APLICADA

### Cambios en `src/app/page.tsx`:

1. **Agregada verificación de ruta actual:**
   ```typescript
   const currentPath = window.location.pathname;
   const isRoot = currentPath === '/' || currentPath === '/index.html';
   
   if (!isRoot) {
     // Ya estamos en una ruta específica, no redirigir
     return;
   }
   ```

2. **Agregada bandera para evitar múltiples redirecciones:**
   ```typescript
   const hasRedirected = useRef(false);
   
   if (hasRedirected.current) {
     // Ya se redirigió, evitar bucle
     return;
   }
   ```

3. **Mejorada detección de Capacitor:**
   - Removida detección incorrecta: `window.location.hostname === 'localhost' && window.location.port === ''`
   - Esta detección causaba falsos positivos en modo "device" de Chrome DevTools

4. **Agregada verificación antes de redirigir:**
   ```typescript
   // Solo redirigir si todavía estamos en la raíz
   if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
     window.location.replace(targetPath);
   }
   ```

---

## 📝 CÓDIGO CORREGIDO

```typescript
"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

// Detectar si estamos en Capacitor de manera más robusta
const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return !!(
    (window as any).Capacitor ||
    (window as any).Ionic ||
    (window as any).__CAPACITOR__ ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:'
    // Removido: detección incorrecta de localhost
  );
};

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const hasRedirected = useRef(false); // Bandera para evitar múltiples redirecciones

  useEffect(() => {
    // Solo redirigir si estamos en la raíz y no hemos redirigido ya
    const currentPath = window.location.pathname;
    const isRoot = currentPath === '/' || currentPath === '/index.html';
    
    if (!isRoot) {
      console.log('✅ Ya estamos en una ruta específica, no redirigir:', currentPath);
      setIsRedirecting(false);
      return;
    }

    // Prevenir múltiples redirecciones
    if (hasRedirected.current) {
      console.log('⏭️ Ya se redirigió, evitando bucle');
      return;
    }

    // Redirección inmediata sin esperar React
    const redirectImmediately = () => {
      try {
        hasRedirected.current = true; // Marcar como redirigido ANTES de redirigir
        
        const savedUser = localStorage.getItem('currentUser');
        const targetPath = savedUser ? '/dashboard/' : '/sign-in/';
        
        console.log('🚀 Redirección desde raíz:', {
          hasUser: !!savedUser,
          targetPath,
          isCapacitor: isCapacitor(),
          currentPath: window.location.pathname
        });
        
        // Solo redirigir si todavía estamos en la raíz
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
          window.location.replace(targetPath);
        }
      } catch (error) {
        console.error('❌ Error en redirección inmediata:', error);
        hasRedirected.current = false; // Permitir reintento si hay error
      }
    };

    // Intentar redirección inmediata
    redirectImmediately();
    
    // Fallback: si después de 500ms todavía estamos en la raíz, forzar de nuevo
    const fallbackTimer = setTimeout(() => {
      const stillAtRoot = window.location.pathname === '/' || window.location.pathname === '/index.html';
      if (stillAtRoot && !hasRedirected.current) {
        console.warn('⚠️ Redirección falló, intentando de nuevo...');
        hasRedirected.current = true;
        try {
          const savedUser = localStorage.getItem('currentUser');
          const targetPath = savedUser ? '/dashboard/' : '/sign-in/';
          window.location.replace(targetPath);
        } catch (error) {
          console.error('❌ Error en redirección fallback:', error);
          hasRedirected.current = false;
        }
      }
    }, 500);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Mostrar loading mientras se verifica la sesión
  return <LoadingScreen text={isRedirecting ? "Redirigiendo..." : undefined} />;
}
```

---

## ✅ VERIFICACIÓN

### Tests Realizados:
- [x] Build compilado exitosamente
- [x] Sincronización con Capacitor exitosa
- [x] APK recompilado con corrección

### Próximos Pasos:
1. Instalar el nuevo APK en el dispositivo
2. Verificar que no haya bucle de recarga
3. Confirmar que la redirección funciona correctamente

---

## 🎯 RESULTADO ESPERADO

Después de aplicar la corrección:
- ✅ La app NO se recarga infinitamente
- ✅ La redirección funciona correctamente desde la raíz
- ✅ No hay bucles cuando se navega entre páginas
- ✅ La detección de Capacitor es más precisa

---

**Última actualización:** 2025-01-16

