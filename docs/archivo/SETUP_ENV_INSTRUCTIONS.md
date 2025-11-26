# 🔑 INSTRUCCIONES PARA CONFIGURAR VARIABLES DE ENTORNO

## 📁 Crear archivo .env.local

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# Variables de entorno para la aplicación

# OpenAI API Key para Whisper
# Obtén tu API key en: https://platform.openai.com/api-keys
NEXT_PUBLIC_OPENAI_API_KEY=tu_api_key_aqui

# Configuración de Whisper
NEXT_PUBLIC_WHISPER_MODEL=whisper-1
NEXT_PUBLIC_WHISPER_LANGUAGE=es
NEXT_PUBLIC_WHISPER_TEMPERATURE=0.0

# N8N Webhook URL (para futuras fases)
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/voz-gasto

# Configuración de la aplicación
NEXT_PUBLIC_APP_NAME=Ahorro365
NEXT_PUBLIC_APP_VERSION=0.0.1
```

## 🔑 Obtener API Key de OpenAI

1. **Ve a:** [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Inicia sesión** con tu cuenta de OpenAI
3. **Crea una nueva API key:**
   - Haz clic en "Create new secret key"
   - Dale un nombre descriptivo (ej: "Ahorro365 Whisper")
   - Copia la key generada
4. **Reemplaza** `tu_api_key_aqui` con tu API key real

## 🔄 Reiniciar Servidor

Después de crear el archivo `.env.local`:

```bash
# Detener el servidor actual (Ctrl+C)
# Luego ejecutar:
npm run dev
```

## ✅ Verificar Configuración

Una vez configurado, deberías ver en la consola:
```
✅ OpenAI API Key configurada correctamente
```

En lugar de:
```
⚠️ OpenAI API Key no encontrada en variables de entorno
```

## 🧪 Probar Transcripción

1. **Mantén presionado** el botón del micrófono
2. **Habla claramente** en español
3. **Suelta el botón** para detener
4. **Observa la transcripción** en el componente flotante

## 💰 Costos Estimados

- **Whisper API:** ~$0.006 por minuto de audio
- **Uso moderado:** <$1/mes para uso personal
- **Ejemplo:** 10 grabaciones de 30 segundos = ~$0.03
