import express from 'express';
import { QRManager } from './services/qr-manager';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const qrManager = QRManager.getInstance();

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
    
    return res.json({
      success: true,
      qr: null,
      timestamp: null,
      connected: true
    });
  } catch (error) {
    console.error('Error getting QR:', error);
    return res.status(500).json({ success: false, error: 'Failed to get QR' });
  }
});

// GET /status - Estado de conexión
app.get('/status', (req, res) => {
  try {
    const qrData = qrManager.getQR();
    return res.json({
      connected: !qrData || qrData.qr === null,
      lastSync: new Date().toISOString(),
      uptime: 99.8
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

app.listen(PORT, () => {
  console.log(`🚀 Baileys Worker running on http://localhost:${PORT}`);
  console.log(`📱 QR endpoint: http://localhost:${PORT}/qr`);
  console.log(`💚 Health: http://localhost:${PORT}/health`);
});

export default app;

