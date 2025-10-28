# Contribuyendo a Baileys Worker

## 🚀 Quick Start

### Configuración de Desarrollo

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar .env**
```bash
cp .env.example .env
# Editar .env con tus valores
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Escanear QR**
- Abre WhatsApp Business
- Configuración → Dispositivos vinculados → Vincular dispositivo
- Escanea el QR que aparece en la terminal

## 📁 Estructura del Proyecto

```
ahorro365-baileys-worker/
├── src/
│   ├── index.ts              # Entry point
│   ├── server.ts              # Express server
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   └── services/
│       ├── whatsapp.ts       # WhatsApp connection
│       └── qr-manager.ts     # QR code management
├── package.json
├── tsconfig.json
├── Dockerfile
├── railway.json
└── README.md
```

## 🔧 Desarrollo

### Endpoints Locales

- **QR:** `http://localhost:3000/qr`
- **Status:** `http://localhost:3000/status`
- **Health:** `http://localhost:3000/health`

### Testing

```bash
# Test 1: Health check
curl http://localhost:3000/health

# Test 2: Get QR
curl http://localhost:3000/qr

# Test 3: Get status
curl http://localhost:3000/status
```

## 🚢 Deployment

### Railway (Recomendado)

1. Crear cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Conectar repositorio
4. Railway detectará el Dockerfile automáticamente
5. Configurar variables de entorno
6. Deploy!

### Variables de Entorno en Railway

```env
WHATSAPP_NUMBER=+591xxxxxxxx
BACKEND_URL=https://ahorro365-backend.vercel.app
BACKEND_API_KEY=your-secret-key
NODE_ENV=production
PORT=3000
```

## 🐛 Troubleshooting

### Error: "QR not generating"
**Solución:** Elimina la carpeta `auth_info/` y reinicia:
```bash
rm -rf auth_info/
npm run dev
```

### Error: "Connection timeout"
**Solución:** Verifica que el backend esté accesible y la API key sea correcta

### Error: "Session expired"
**Solución:** Re-escanea el QR generando un nuevo código

## 📝 Próximos Pasos

- [ ] Integración con backend real
- [ ] Procesamiento de audios con Whisper
- [ ] Confirmaciones automáticas a usuarios
- [ ] Logs detallados en Railway
- [ ] Health checks avanzados

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

