# Verificar Firebase Admin en el Servidor

**Importante:** Los logs del navegador (cliente) son diferentes a los logs del servidor.

---

## 🔍 Dónde Buscar los Logs del Servidor

Los logs del servidor aparecen en la **terminal/consola donde ejecutaste `npm run dev`**, NO en el navegador.

### Busca estos mensajes:

**✅ Si Firebase Admin está correcto:**
```
✅ Cliente Supabase Admin creado correctamente
```

**❌ Si Firebase Admin NO está configurado:**
```
⚠️ Firebase Admin SDK no se inicializó: faltan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY.
```

---

## 📋 Verificación Rápida

### Paso 1: Abre la Terminal del Servidor

Busca la terminal/consola donde ejecutaste `npm run dev`. Debería mostrar algo como:

```
▲ Next.js 15.x.x
- Local:        http://localhost:3000
- Ready in X.XXs
```

### Paso 2: Busca los Mensajes de Firebase Admin

Desplázate hacia arriba en la terminal y busca:
- `✅ Cliente Supabase Admin creado correctamente`
- O `⚠️ Firebase Admin SDK no se inicializó...`

### Paso 3: Si No Ves Ningún Mensaje

Si no ves ningún mensaje relacionado con Firebase Admin, puede ser que:
1. El servidor se inició antes de que se cargaran las variables de entorno
2. Firebase Admin se inicializa solo cuando se usa por primera vez

---

## 🧪 Prueba Rápida: Verificar si Firebase Admin Funciona

La mejor forma de verificar es **intentar enviar una notificación**. Si Firebase Admin está configurado, funcionará. Si no, verás el error.

---

## 📝 Lo que Necesito

Por favor, comparte:
1. **Los logs de la terminal del servidor** (donde corre `npm run dev`)
2. Específicamente busca mensajes relacionados con:
   - `Firebase Admin`
   - `Supabase Admin`
   - Cualquier error o warning

---

## 🎯 Próximo Paso

Una vez que verifiquemos que Firebase Admin está funcionando, podemos probar el flujo completo de referidos.

