# Guía rápida: Recuperar conexión de Baileys (QR)

Esta guía documenta el procedimiento probado cuando el panel muestra "Generando código QR..." o WhatsApp no permite vincular el dispositivo.

## 0) Requisitos
- Asegúrate de que NO esté corriendo el worker local (`npm run dev`) para evitar `connectionReplaced`.
- Trabajamos sobre la app Fly.io: `ahorro365-baileys-worker`.

## 1) Verificar visor de QR
- Visor: `https://ahorro365-baileys-worker.fly.dev/qr/view?t=NOW` (anti‑caché)
- API cruda: `https://ahorro365-baileys-worker.fly.dev/qr` (debe traer `{ qr: data:image/png;base64..., timestamp }`)

Si `qr` es `null` por más de 60s, pasa al paso 2.

## 2) Reiniciar el worker (reactivar emisión de QR)
```bash
flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```
- Espera 10–30s y vuelve a abrir el visor `/qr/view?t=NOW`.

## 3) Evitar bucle EBUSY (no borrar el volumen montado)
Si se activó `FORCE_NEW_SESSION` y ves `EBUSY: rmdir '/app/auth_info'` en logs:
```bash
flyctl secrets unset FORCE_NEW_SESSION -a ahorro365-baileys-worker
```
Reinicia la máquina y vuelve a abrir el visor.

## 4) Limpieza fina de credenciales (sin borrar el volumen)
Si sigue sin aparecer el QR o no vincula:
```bash
flyctl ssh console -a ahorro365-baileys-worker -C \
  "sh -lc 'rm -f /app/auth_info/*.json; ls -l /app/auth_info'"

flyctl machines restart <MACHINE_ID> -a ahorro365-baileys-worker
```

## 5) Escaneo correcto
- WhatsApp → Dispositivos vinculados → Cerrar sesión en todos (si hay)
- Vincular dispositivo → escanea en cuanto el visor diga "QR listo"
- Si dice "No se pudo vincular", repite cierre de sesiones y escanea tras la siguiente rotación del QR (~60s)

## 6) Logs útiles
```bash
flyctl logs -a ahorro365-baileys-worker --no-tail
```
Busca: `QR Generado`, `QR guardado exitosamente`, `connectionClosed (428)`.

## 7) Notas
- El visor `/qr/view` consume el MISMO QR que emite Baileys (guardado por `QRManager` en `.qr`). Si no refresca, usa ventana privada o `Ctrl+Shift+R`.
- La ruta `/qr` devuelve el QR vigente y su `timestamp`.


