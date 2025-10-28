import fs from 'fs';
import path from 'path';
import { IQRData } from '../types';

const QR_FILE_PATH = path.join(process.cwd(), '.qr');

export class QRManager {
  private static instance: QRManager;
  private currentQR: IQRData | null = null;

  private constructor() {
    this.loadQR();
  }

  public static getInstance(): QRManager {
    if (!QRManager.instance) {
      QRManager.instance = new QRManager();
    }
    return QRManager.instance;
  }

  // Guardar QR
  public saveQR(qrData: IQRData): void {
    this.currentQR = qrData;
    try {
      fs.writeFileSync(QR_FILE_PATH, JSON.stringify(qrData), 'utf-8');
    } catch (error) {
      console.error('Error saving QR:', error);
    }
  }

  // Cargar QR
  public loadQR(): IQRData | null {
    try {
      if (fs.existsSync(QR_FILE_PATH)) {
        const data = fs.readFileSync(QR_FILE_PATH, 'utf-8');
        this.currentQR = JSON.parse(data);
        return this.currentQR;
      }
    } catch (error) {
      console.error('Error loading QR:', error);
    }
    return null;
  }

  // Obtener QR actual
  public getQR(): IQRData | null {
    return this.currentQR || this.loadQR();
  }

  // Limpiar QR (cuando ya está conectado)
  public clearQR(): void {
    this.currentQR = null;
    try {
      if (fs.existsSync(QR_FILE_PATH)) {
        fs.unlinkSync(QR_FILE_PATH);
      }
    } catch (error) {
      console.error('Error clearing QR:', error);
    }
  }
}

