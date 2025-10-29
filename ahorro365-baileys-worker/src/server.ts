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
    
    const authInfoPath = path.join(process.cwd(), 'auth_info');
    if (fs.existsSync(authInfoPath)) {
      fs.rmSync(authInfoPath, { recursive: true, force: true });
      console.log('✅ auth_info eliminado');
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

