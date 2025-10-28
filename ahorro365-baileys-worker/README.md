# Ahorro365 Baileys Worker

Worker de WhatsApp usando Baileys para procesar audios y mensajes de usuarios.

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar .env
Copia `.env.example` a `.env` y configura:
```env
WHATSAPP_NUMBER=+591xxxxxxxx
BACKEND_URL=http://localhost:3000
BACKEND_API_KEY=your-secret-key
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Escanear QR
1. Abre WhatsApp Business
2. Configuración → Dispositivos vinculados
3. Vincular dispositivo
4. Escanea el QR que aparece en la terminal

## 📦 Build para producción
```bash
npm run build
npm start
```

## 🚢 Deployment en Railway

### 1. Preparar el código
```bash
# Asegurar que todo está en Git
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. En Railway Dashboard

1. Clic en **"+ New Project"**
2. Selecciona **"Deploy from GitHub"**
3. Selecciona el repo: `ai-app`
4. Railway automáticamente detecta `Dockerfile`
5. Agrega variables de entorno (ver `.env.example`)
6. Clic en **"Deploy"**

### 3. Configurar Variables de Entorno en Railway

Ve a **Variables** → Agrega:

```env
WHATSAPP_NUMBER=59160360908
BACKEND_URL=https://tu-backend.vercel.app
BACKEND_API_KEY=tu-secret-key
ADMIN_DASHBOARD_URL=https://tu-admin-dashboard.vercel.app
PORT=3004
NODE_ENV=production
LOG_LEVEL=info
```

### 4. Verificar Deployment

Railway asignará una URL pública:
```
https://baileys-worker-xxxxx.railway.app
```

Verifica que funcione:
```bash
curl https://baileys-worker-xxxxx.railway.app/health
# { "status": "ok", "service": "baileys-worker" }
```

### 5. Escanear QR

1. Ve a la URL del worker en Railway
2. Accede a `/qr` para ver el código QR
3. Escanea con WhatsApp Business
4. ¡Listo! Tu worker está funcionando 24/7

## 📡 Endpoints

- `GET /qr` - Obtener QR code actual
- `GET /status` - Estado de conexión
- `GET /health` - Health check
- `POST /process` - Procesar mensajes (futuro)

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `WHATSAPP_NUMBER` | Número de WhatsApp Business | `+59170000000` |
| `BACKEND_URL` | URL del backend | `https://ahorro365-backend.vercel.app` |
| `BACKEND_API_KEY` | API key para autenticación | `secret-key-123` |
| `PORT` | Puerto del servidor | `3000` |

## 📝 Flujo de Mensajes

1. Usuario envía audio por WhatsApp
2. Baileys Worker recibe el mensaje
3. Worker envía audio al Backend
4. Backend procesa con Groq (Whisper + LLM)
5. Backend retorna datos extraídos
6. Worker envía confirmación al usuario

## 🐛 Troubleshooting

### QR no se genera
- Verifica que `auth_info/` exista
- Elimina carpeta `auth_info/` y vuelve a iniciar
- Reinicia el servidor

### No se conecta
- Verifica que el QR esté escaneado
- Revisa logs en Railway
- Verifica que backend esté accesible

## 📚 Documentación

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Railway Documentation](https://docs.railway.app)

