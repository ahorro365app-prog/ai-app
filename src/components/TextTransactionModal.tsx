"use client";

import { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { groqService } from '@/services/groqService';
import { useModal } from '@/contexts/ModalContext';
import { useSupabase } from '@/contexts/SupabaseContext';

// Mapeo de monedas con gramática específica
const currencyMap: Record<string, { 
  code: string; 
  symbol: string; 
  name: string; 
  locale: string;
  singular: string;
  plural: string;
  centsName: string;
}> = {
  'BO': { 
    code: 'BOB', 
    symbol: 'Bs', 
    name: 'Boliviano', 
    locale: 'es-BO',
    singular: 'boliviano',
    plural: 'bolivianos',
    centsName: 'centavos de boliviano'
  },
  'US': { 
    code: 'USD', 
    symbol: '$', 
    name: 'Dólar estadounidense', 
    locale: 'en-US',
    singular: 'dólar',
    plural: 'dólares',
    centsName: 'centavos de dólar'
  },
  'EU': { 
    code: 'EUR', 
    symbol: '€', 
    name: 'Euro', 
    locale: 'es-ES',
    singular: 'euro',
    plural: 'euros',
    centsName: 'centavos de euro'
  },
  'MX': { 
    code: 'MXN', 
    symbol: '$', 
    name: 'Peso mexicano', 
    locale: 'es-MX',
    singular: 'peso mexicano',
    plural: 'pesos mexicanos',
    centsName: 'centavos de peso mexicano'
  },
  'AR': { 
    code: 'ARS', 
    symbol: '$', 
    name: 'Peso argentino', 
    locale: 'es-AR',
    singular: 'peso argentino',
    plural: 'pesos argentinos',
    centsName: 'centavos de peso argentino'
  },
  'CL': { 
    code: 'CLP', 
    symbol: '$', 
    name: 'Peso chileno', 
    locale: 'es-CL',
    singular: 'peso chileno',
    plural: 'pesos chilenos',
    centsName: 'centavos de peso chileno'
  },
  'PE': { 
    code: 'PEN', 
    symbol: 'S/', 
    name: 'Sol peruano', 
    locale: 'es-PE',
    singular: 'sol',
    plural: 'soles',
    centsName: 'centavos de sol'
  },
  'CO': { 
    code: 'COP', 
    symbol: '$', 
    name: 'Peso colombiano', 
    locale: 'es-CO',
    singular: 'peso colombiano',
    plural: 'pesos colombianos',
    centsName: 'centavos de peso colombiano'
  },
};

interface TextTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcess: (groqData: any) => void;
}

export default function TextTransactionModal({ isOpen, onClose, onProcess }: TextTransactionModalProps) {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setModalOpen } = useModal();
  const { user } = useSupabase();

  // Obtener la moneda del usuario con gramática correcta
  const getUserCurrency = () => {
    if (!user?.moneda) return { singular: 'boliviano', plural: 'bolivianos', cents: 'centavos de boliviano' };
    
    // Buscar el país que corresponde a la moneda del usuario
    const countryCode = Object.keys(currencyMap).find(key => 
      currencyMap[key].code === user.moneda
    );
    
    if (countryCode) {
      const currency = currencyMap[countryCode];
      return {
        singular: currency.singular,
        plural: currency.plural,
        cents: currency.centsName
      };
    }
    
    return { singular: 'boliviano', plural: 'bolivianos', cents: 'centavos de boliviano' };
  };

  const userCurrency = getUserCurrency();

  // Notificar al contexto cuando el modal se abre/cierra
  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Por favor, escribe algo antes de enviar');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('📝 Procesando texto con Groq:', text);
      
      // Usar el mismo servicio que usa el audio
      // Obtener el país del usuario para usar su zona horaria
      const userCountry = user?.pais || 'BO'; // Default a Bolivia si no hay país
      const groqResult = await groqService.processTranscriptionMultiple(text, userCountry);
      
      if (groqResult && groqResult.transacciones.length > 0) {
        console.log('✅ Groq procesó el texto exitosamente:', groqResult);
        
        // Cerrar este modal y pasar los datos al VoiceConfirmationModal
        onProcess(groqResult);
        onClose();
      } else {
        setError('No se pudieron procesar las transacciones. Intenta con un formato más claro.');
      }
    } catch (err: any) {
      console.error('❌ Error procesando texto:', err);
      setError('Error al procesar el texto. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setText('');
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Send size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Registrar por Texto</h3>
              <p className="text-sm text-gray-600">Escribe tus gastos o ingresos</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe tus transacciones *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Ejemplo: Gasté 50 ${userCurrency.plural} en comida y 1 ${userCurrency.singular} en transporte. También recibí 200 ${userCurrency.plural} de salario.`}
              className="w-full h-32 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-green-500 focus:outline-none resize-none text-gray-500 modal-input"
              autoFocus
              disabled={isProcessing}
            />
            <p className="text-xs text-gray-500 mt-2">
              Puedes escribir múltiples transacciones en un solo texto
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Ejemplos */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm font-semibold text-green-800 mb-2">Ejemplos:</p>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• "Gasté 30 {userCurrency.plural} en almuerzo"</li>
              <li>• "Compré ropa por 150 {userCurrency.plural}"</li>
              <li>• "Recibí mi salario de 2000 {userCurrency.plural}"</li>
              <li>• "Ayer gasté 1 {userCurrency.singular} en comida y 0.50 {userCurrency.cents}"</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!text.trim() || isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isProcessing ? 'Procesando...' : 'Procesar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
