"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle, X, Copy, QrCode, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useCurrency } from "@/hooks/useCurrency";
import QRCode from "react-qr-code";
import { logger } from "@/lib/logger";

const PRO_PRICE_BASE_USDT = 3.00; // Precio base del plan
const PRO_TAX_RATE = 0.10; // Tasa del 10%
const PRO_TAX_AMOUNT_USDT = 0.30; // Tasa en USDT
const PRO_PRICE_USDT = 3.30; // Total: precio base + tasa
const PRO_PRICE_USD = 3.30; // Aproximado

// Dirección wallet USDT (BEP-20 BSC)
const WALLET_ADDRESS = "0x34ea390225f75b2f87482e5b91a8a08dc5a58cc2";

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useSupabase();
  const { currency } = useCurrency();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [hashTransaccion, setHashTransaccion] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const currentExpirationDate = user?.fecha_expiracion_suscripcion
    ? new Date(user.fecha_expiracion_suscripcion)
    : null;
  const projectedExpirationDate = currentExpirationDate
    ? new Date(currentExpirationDate.getTime() + THIRTY_DAYS_MS)
    : new Date(Date.now() + THIRTY_DAYS_MS);

  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        setError('Solo se aceptan imágenes (JPG, PNG) o PDF');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo debe ser menor a 5MB');
        return;
      }

      setReceiptFile(file);
      setError(null);

      // Crear preview si es imagen
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(WALLET_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Error copiando dirección:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('Debes iniciar sesión para realizar el pago');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Subir comprobante si existe
      let comprobanteUrl: string | null = null;
      
      if (receiptFile) {
        const formData = new FormData();
        formData.append('file', receiptFile);
        formData.append('folder', 'payment-receipts');
        // userId se envía en header para autenticación segura

        const uploadResponse = await fetch('/api/payments/upload-receipt', {
          method: 'POST',
          headers: {
            'x-user-id': user.id, // Header personalizado para autenticación
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir comprobante');
        }

        const uploadData = await uploadResponse.json();
        comprobanteUrl = uploadData.url;
      }

      // 2. Crear registro de pago
      // Enviar userId en header para autenticación segura
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id, // Header personalizado para autenticación
        },
        body: JSON.stringify({
          plan: 'pro',
          monto_usdt: PRO_PRICE_USDT,
          direccion_wallet: WALLET_ADDRESS,
          hash_transaccion: hashTransaccion.trim() || null,
          comprobante_url: comprobanteUrl,
          notas: null,
        }),
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Error al crear registro de pago');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="pt-[40px] px-4 pb-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-lg border border-gray-200 text-center">
          <CheckCircle size={48} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Pago registrado!</h2>
          <p className="text-gray-600 mb-4">
            Tu pago ha sido registrado exitosamente. Nuestro equipo lo verificará en un plazo de 5 a 60 minutos en horarios laborales.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Recibirás una notificación cuando tu plan Pro sea activado.
          </p>
          <button
            onClick={() => router.push('/billing')}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all"
          >
            Volver a Planes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-[40px] px-4 pb-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Volver</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagar Plan Pro</h1>
        <div className="mt-2 p-4 bg-purple-50 rounded-3xl border border-purple-200">
          <p className="text-xs font-semibold text-purple-700 uppercase mb-2">
            Tu renovación
          </p>
          <p className="text-sm text-purple-900">
            {currentExpirationDate ? (
              <>
                Plan vigente hasta <strong>{formatDate(currentExpirationDate)}</strong>.
              </>
            ) : (
              'Tu plan Pro se activará cuando confirmemos el pago.'
            )}
          </p>
          <p className="text-xs text-purple-700/80 mt-1">
            Este pago agrega 30 días extra. Nueva expiración estimada:{' '}
            <strong>{formatDate(projectedExpirationDate)}</strong>.
          </p>
        </div>
        <p className="mt-3 text-gray-600">Sigue las instrucciones para completar tu pago</p>
      </div>

      {/* Resumen del Plan */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Plan Pro</h3>
            <p className="text-sm text-gray-600">Suscripción mensual</p>
          </div>

          <div className="text-right">
            <div className="space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm text-gray-600">Plan Pro:</span>
                <span className="text-sm font-medium text-gray-900">${PRO_PRICE_BASE_USDT.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-sm text-gray-600">Tasa 10%:</span>
                <span className="text-sm font-medium text-gray-900">${PRO_TAX_AMOUNT_USDT.toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-gray-200 pt-1 mt-1">
                <p className="text-2xl font-bold text-gray-900">${PRO_PRICE_USDT.toFixed(2)} USDT</p>
                <p className="text-sm text-gray-500">~${PRO_PRICE_USD.toFixed(2)} USD</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instrucciones de Pago */}
      <div className="bg-blue-50 rounded-3xl p-6 mb-6 border border-blue-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          <span>Instrucciones de Pago</span>
        </h3>
        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">1.</span>
            <span>Envía exactamente <strong>${PRO_PRICE_USDT.toFixed(2)} USDT</strong> a la dirección de wallet indicada abajo.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <span>Usa la red <strong>BEP-20 (BSC - Binance Smart Chain)</strong> para menores comisiones.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">3.</span>
            <span>Opcionalmente, guarda el hash de la transacción para verificación más rápida.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">4.</span>
            <span>Sube un comprobante (screenshot o PDF) de tu pago.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">5.</span>
            <span>Tu plan será activado en <strong>5 a 60 minutos</strong> en horarios laborales (Lunes a Viernes, 9:00 AM - 6:00 PM hora Bolivia).</span>
          </li>
        </ol>
      </div>

      {/* Dirección de Wallet */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <QrCode size={20} />
          <span>Dirección de Wallet</span>
        </h3>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
          {/* Código QR */}
          <div className="flex justify-center mb-4">
            <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
              <QRCode
                value={WALLET_ADDRESS}
                size={200}
                level="H"
              />
            </div>
          </div>
          
          {/* Dirección de texto */}
          <p className="text-xs font-mono text-gray-900 break-all mb-3 text-center">{WALLET_ADDRESS}</p>
          
          {/* Botón copiar */}
          <button
            onClick={handleCopyAddress}
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle size={16} />
                <span>¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copiar Dirección</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          ⚠️ Asegúrate de copiar la dirección completa y verificarla antes de enviar
        </p>
      </div>

      {/* Hash de Transacción (Opcional) */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Hash de Transacción (Opcional)</h3>
        <input
          type="text"
          value={hashTransaccion}
          onChange={(e) => setHashTransaccion(e.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm font-mono"
        />
        <p className="text-xs text-gray-500 mt-2">
          Si proporcionas el hash de la transacción, la verificación será más rápida
        </p>
      </div>

      {/* Subir Comprobante */}
      <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Upload size={20} />
          <span>Comprobante de Pago</span>
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {!receiptFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 px-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 transition-colors text-gray-600"
          >
            <Upload size={24} className="mx-auto mb-2" />
            <p className="text-sm font-medium">Haz clic para subir comprobante</p>
            <p className="text-xs text-gray-500 mt-1">JPG, PNG o PDF (máx. 5MB)</p>
          </button>
        ) : (
          <div className="space-y-3">
            {receiptPreview && (
              <div className="relative">
                <img
                  src={receiptPreview}
                  alt="Preview"
                  className="w-full rounded-xl border border-gray-200 max-h-64 object-contain bg-gray-50"
                />
                <button
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {!receiptPreview && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Upload size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{receiptFile.name}</p>
                    <p className="text-xs text-gray-500">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              Cambiar Archivo
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Botón Enviar */}
      <button
        onClick={handleSubmit}
        disabled={loading || !receiptFile}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <CheckCircle size={20} />
            <span>Registrar Pago</span>
          </>
        )}
      </button>

      {/* Contacto WhatsApp */}
      <div className="mt-6 bg-green-50 rounded-3xl p-6 border border-green-200 text-center">
        <p className="text-sm text-gray-700 mb-3">
          ¿Necesitas ayuda con el pago o tienes dudas?
        </p>
        <button
          onClick={() => {
            const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '+59161600190';
            window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola, necesito ayuda con el pago del plan Pro`, '_blank');
          }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span>Contactar Soporte por WhatsApp</span>
        </button>
      </div>
    </div>
  );
}

