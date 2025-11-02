import express from 'express';
import { QRManager } from './services/qr-manager';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

const qrManager = QRManager.getInstance();

// Estado global de conexión
let isConnected = false;
let lastSync: string | null = null;

// GET /qr - Retorna QR actual
app.get('/qr', (req, res) => {
  try {
    const qrData = qrManager.getQR();
    if (qrData) {
      return res.json({
        success: true,
        qr: qrData.qr,
        timestamp: qrData.timestamp,
        connected: false
      });
    }
    
    // Si no hay QR pero está conectado
    if (isConnected) {
    return res.json({
      success: true,
      qr: null,
      timestamp: null,
      connected: true
      });
    }
    
    // Si no hay QR y no está conectado, podría estar iniciando
    return res.json({
      success: true,
      qr: null,
      timestamp: null,
      connected: false
    });
  } catch (error) {
    console.error('Error getting QR:', error);
    return res.status(500).json({ success: false, error: 'Failed to get QR' });
  }
});

// GET /qr/view - Página HTML que muestra el QR (autorefresco)
app.get('/qr/view', (_req, res) => {
  const html = `<!doctype html>
  <html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WhatsApp QR</title>
    <style>
      body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0b1020;color:#e7eaf3;margin:0}
      .card{background:#111831;border:1px solid #1f2944;border-radius:16px;padding:24px 28px;box-shadow:0 6px 28px rgba(0,0,0,.35);max-width:560px;width:100%;text-align:center}
      h1{font-size:20px;margin:0 0 6px}
      p{margin:0 0 14px;color:#aab2cf}
      #qr{width:320px;height:320px;border-radius:12px;background:#0e1530;border:1px dashed #2b3a67;display:inline-block}
      .ok{color:#5ee191}
      .warn{color:#f5a524}
      small{color:#7e8bb6}
      button{margin-top:14px;background:#2446f6;color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer}
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Escanea el código QR</h1>
      <p>Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
      <img id="qr" alt="QR" />
      <p id="state" class="warn">Generando QR...</p>
      <small>Se actualiza automáticamente</small><br/>
      <button onclick="location.reload()">Actualizar</button>
    </div>
    <script>
      async function loadQR(){
        try{
          const r = await fetch('/qr',{cache:'no-store'});
          const d = await r.json();
          const img = document.getElementById('qr');
          const state = document.getElementById('state');
          if(d && d.qr){
            img.src = d.qr;
            state.textContent = 'QR listo. Escanéalo con tu teléfono.';
            state.className = 'ok';
          }else if(d && d.connected){
            state.textContent = 'Conectado a WhatsApp';
            state.className = 'ok';
          }else{
            state.textContent = 'Esperando QR...';
            state.className = 'warn';
          }
        }catch(e){
          console.error(e);
        }
      }
      loadQR();
      setInterval(loadQR, 2500);
    </script>
  </body>
  </html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// GET /status - Estado de conexión
app.get('/status', (req, res) => {
  try {
    return res.json({
      connected: isConnected,
      lastSync: lastSync,
      uptime: isConnected ? 99.8 : 0
    });
  } catch (error) {
    console.error('Error getting status:', error);
    return res.status(500).json({ error: 'Failed to get status' });
  }
});

// GET /health - Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'baileys-worker',
    timestamp: new Date().toISOString()
  });
});

// POST /process - Procesar mensajes (para integraciones futuras)
app.post('/process', (req, res) => {
  const { from, message, type } = req.body;

  console.log('Processing message:', { from, message, type });

  // Aquí procesarías el mensaje con el backend
  res.json({
    success: true,
    message: 'Message processed'
  });
});

// GET /clean-session - Limpiar sesión (para debugging)
app.get('/clean-session', (req, res) => {
  try {
    console.log('🧹 Limpiando sesión manualmente...');
    
    isConnected = false;
    lastSync = null;
    qrManager.clearQR();
    
    // Usar el mismo path que WhatsAppService
    const authInfoPath = process.env.BAILEYS_SESSION_PATH || path.join(process.cwd(), 'auth_info');
    console.log(`📁 Intentando limpiar: ${authInfoPath}`);
    
    if (fs.existsSync(authInfoPath)) {
      // Intentar eliminar archivos JSON dentro
      try {
        const files = fs.readdirSync(authInfoPath);
        console.log(`📂 Archivos encontrados: ${files.join(', ')}`);
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(authInfoPath, file));
            console.log(`🗑️ Eliminado: ${file}`);
          }
        }
        console.log('✅ archivos JSON eliminados');
      } catch (err) {
        console.error('Error eliminando archivos:', err);
      }
    } else {
      console.log('⚠️ Directorio auth_info no existe');
    }
    
    res.json({ success: true, message: 'Session cleaned. Restart the worker.' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Failed to clean session' });
  }
});

// POST /disconnect - Desconectar WhatsApp y limpiar sesión
app.post('/disconnect', (req, res) => {
  try {
    console.log('🔄 Desconectando WhatsApp...');
    
    // IMPORTANTE: Setear estado a desconectado
    isConnected = false;
    lastSync = null;
    
    // Limpiar QR
    qrManager.clearQR();
    
    // Eliminar archivos de autenticación
    const authInfoPath = path.join(process.cwd(), 'auth_info');
    if (fs.existsSync(authInfoPath)) {
      fs.rmSync(authInfoPath, { recursive: true, force: true });
      console.log('✅ Archivos de autenticación eliminados');
    }
    
    console.log('✅ Sesión desconectada. Reinicia el worker para generar nuevo QR.');
    
    res.json({
      success: true,
      connected: false,
      message: 'Disconnected successfully. Please restart the worker to generate a new QR.'
    });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Baileys Worker running on http://localhost:${PORT}`);
  console.log(`📱 QR endpoint: http://localhost:${PORT}/qr`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

// Exportar funciones para actualizar estado
export const setConnectionStatus = (connected: boolean) => {
  isConnected = connected;
  if (connected) {
    lastSync = new Date().toISOString();
  } else {
    lastSync = null;
  }
  console.log(`🔔 Estado de conexión actualizado: ${connected ? 'CONECTADO' : 'DESCONECTADO'}`);
};

export default app;

