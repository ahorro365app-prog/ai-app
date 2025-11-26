# ✅ INSTRUCCIONES PARA PROBAR SENTRY

**Estado**: Variables de entorno configuradas ✅  
**Próximo paso**: Probar que Sentry capture errores

---

## 🚀 PASOS RÁPIDOS

### Paso 1: Habilitar Debug en Desarrollo (Temporal)

Agrega a tu `.env.local` (app principal):

```bash
NEXT_PUBLIC_SENTRY_DEBUG=true
```

**⚠️ IMPORTANTE**: 
- Esta variable habilita Sentry en desarrollo (normalmente está deshabilitado)
- **Solo úsala para probar**
- Después de probar, quítala o Sentry enviará todos los errores de desarrollo

---

### Paso 2: Reiniciar el Servidor

```bash
# Detén el servidor actual (Ctrl+C)
# Reinicia el servidor
npm run dev
```

---

### Paso 3: Visitar la Página de Prueba

1. Abre tu navegador
2. Ve a: `http://localhost:3000/test-sentry`
3. Haz clic en uno de los botones:
   - 🔴 **Generar Error Síncrono**
   - 🟠 **Generar Error Asíncrono**

---

### Paso 4: Verificar en Sentry Dashboard

1. Ve a tu dashboard de Sentry: https://sentry.io/organizations/ahorro-365/issues/
2. Espera unos segundos (los errores pueden tardar un poco)
3. Deberías ver el error aparecer en la lista de "Issues"
4. Haz clic en el error para ver:
   - Stack trace completo
   - Navegador y dispositivo
   - URL donde ocurrió el error
   - Contexto del error

---

## ✅ VERIFICACIÓN

### Checklist

- [ ] `NEXT_PUBLIC_SENTRY_DSN` configurado en `.env.local` ✅
- [ ] `NEXT_PUBLIC_SENTRY_DEBUG=true` agregado temporalmente
- [ ] Servidor reiniciado
- [ ] Página `/test-sentry` visitada
- [ ] Error generado (clic en botón)
- [ ] Error visible en Sentry dashboard
- [ ] Stack trace completo visible
- [ ] Contexto del error visible

---

## 🎯 DESPUÉS DE PROBAR

### Quitar Debug de Desarrollo

Después de verificar que Sentry funciona:

1. **Quita** `NEXT_PUBLIC_SENTRY_DEBUG=true` de `.env.local`
2. Reinicia el servidor
3. Sentry dejará de enviar errores en desarrollo
4. **En producción, Sentry seguirá funcionando automáticamente**

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Sentry no captura errores

1. **Verifica el DSN**: Asegúrate de que `NEXT_PUBLIC_SENTRY_DSN` esté correcto
2. **Verifica debug**: Asegúrate de que `NEXT_PUBLIC_SENTRY_DEBUG=true` esté en `.env.local`
3. **Reinicia el servidor**: Los cambios en `.env.local` requieren reiniciar el servidor
4. **Revisa la consola**: Deberías ver logs de Sentry si está configurado

### Errores no aparecen en Sentry

1. **Espera unos segundos**: Los errores pueden tardar en aparecer
2. **Verifica el DSN**: Asegúrate de que sea correcto
3. **Revisa la consola del navegador**: Puede haber errores de conexión
4. **Verifica que el proyecto esté correcto**: Asegúrate de estar viendo el proyecto correcto en Sentry

---

## 📊 QUÉ ESPERAR

### En Desarrollo (con `NEXT_PUBLIC_SENTRY_DEBUG=true`)

- ✅ Sentry captura todos los errores
- ✅ Los errores aparecen inmediatamente
- ✅ Stack traces completos
- ⚠️ Puede llenar el dashboard rápidamente

### En Producción (sin `NEXT_PUBLIC_SENTRY_DEBUG`)

- ✅ Sentry captura solo errores reales
- ✅ Los errores aparecen automáticamente
- ✅ No se llena el dashboard con errores de desarrollo

---

**¡Listo!** Una vez que verifiques que Sentry funciona, quita `NEXT_PUBLIC_SENTRY_DEBUG=true` y deja que Sentry monitoree solo errores en producción.







