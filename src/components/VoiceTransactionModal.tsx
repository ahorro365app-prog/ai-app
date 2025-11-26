"use client";

import { useState, useEffect, useRef } from 'react';
import { Mic, Edit3, Save, Trash2, CheckCircle, AlertCircle, ChevronDown, TrendingUp, TrendingDown, CreditCard, GraduationCap, ShoppingCart, Car, Heart, Gamepad2, Wrench, Shirt, Home, DollarSign, Type, X } from 'lucide-react';
import { debtSearchService, DebtSearchResult } from '@/services/debtSearchService';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { logger } from '@/lib/logger';
import { buildISODateForCountry, getTodayForCountry, getTimezoneForCountry, validateTransactionDate } from '@/lib/dateUtils';
import { useCurrency } from '@/hooks/useCurrency';
import React from 'react';

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

interface GroqTransaction {
  monto: number | null;
  categoria: string | null;
  tipo: 'gasto' | 'ingreso' | null;
  descripcion: string | null;
  metodoPago: string | null;
  esPagoDeuda?: boolean;
  nombreDeuda?: string | null;
  fechaTexto?: string | null; // Texto de fecha relativa (ej: "ayer", "hace 2 días")
  fecha?: string | null; // Fecha calculada en formato ISO (YYYY-MM-DD)
}

interface GroqMultipleData {
  transacciones: GroqTransaction[];
  esMultiple: boolean;
}

interface VoiceTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptionText: string;
  groqData: GroqMultipleData | null;
  onSave: (data: GroqMultipleData) => void;
  onCancel: () => void;
  source?: 'audio' | 'text'; // Para diferenciar entre voz y texto
}

const CATEGORIAS_DISPONIBLES = [
  'comida',
  'transporte', 
  'educacion',
  'tecnologia',
  'salud',
  'entretenimiento',
  'servicios',
  'ropa',
  'hogar',
  'otros'
];

const METODOS_PAGO_DISPONIBLES = [
  'efectivo',
  'tarjeta',
  'transferencia',
  'cheque',
  'crypto',
  'otro'
];

export default function VoiceTransactionModal({
  isOpen,
  onClose,
  transcriptionText,
  groqData,
  onSave,
  onCancel,
  source = 'audio' // Por defecto es audio para no romper nada
}: VoiceTransactionModalProps) {
  const { debts, addTransaction, user } = useSupabase();
  const { setModalOpen } = useModal();
  const { country } = useCurrency();

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
  const [editingData, setEditingData] = useState<GroqTransaction[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransactionIndex, setCurrentTransactionIndex] = useState(0);
  const [amountInputValue, setAmountInputValue] = useState<string>('');
  const [debtSearchResults, setDebtSearchResults] = useState<DebtSearchResult[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<DebtSearchResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Estados para swipe gesture
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Notificar al contexto cuando el modal se abre/cierra
  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

  // Inicializar datos editables cuando cambie groqData
  useEffect(() => {
    if (groqData && groqData.transacciones.length > 0) {
      const transactionsWithDefaultPayment = groqData.transacciones.map(transaction => ({
        ...transaction,
        metodoPago: transaction.metodoPago || 'efectivo'
      }));
      setEditingData(transactionsWithDefaultPayment);
      setCurrentTransactionIndex(0); // Resetear al primer índice
      setIsEditing(false); // Asegurar que inicie en modo de solo lectura
      setIsSaving(false); // Resetear estado de guardado
      setSaveSuccess(false); // Resetear estado de éxito
      // Inicializar el valor del input de monto
      setAmountInputValue(transactionsWithDefaultPayment[0]?.monto?.toString() || '');
      logger.debug('🔄 Modal inicializado en modo de solo lectura');
    }
  }, [groqData]);

  // Sincronizar el valor del input cuando cambie la transacción actual (solo por swipe)
  useEffect(() => {
    if (editingData.length > 0 && editingData[currentTransactionIndex]) {
      setAmountInputValue(editingData[currentTransactionIndex].monto?.toString() || '');
    }
  }, [currentTransactionIndex]); // Solo cuando cambie el índice, no cuando cambien los datos

  // Buscar deudas cuando se detecte un pago de deuda
  useEffect(() => {
    const searchDebts = async () => {
      const currentTransaction = editingData[currentTransactionIndex];
      if (currentTransaction?.esPagoDeuda && currentTransaction?.nombreDeuda && debts.length > 0) {
        const searchResults = await debtSearchService.searchDebtsByName(
          currentTransaction.nombreDeuda,
          debts,
          { threshold: 60, maxResults: 3 }
        );
        setDebtSearchResults(searchResults);
        
        // Auto-seleccionar la mejor coincidencia si hay una muy buena
        if (searchResults.length > 0 && searchResults[0].coincidencia >= 80) {
          setSelectedDebt(searchResults[0]);
        } else {
          setSelectedDebt(null);
        }
      } else {
        setDebtSearchResults([]);
        setSelectedDebt(null);
      }
    };

    searchDebts();
  }, [editingData, currentTransactionIndex, debts]);

  logger.debug('🎭 VoiceTransactionModal - isOpen:', isOpen, 'groqData:', groqData);

  if (!isOpen) {
    logger.debug('🚫 VoiceTransactionModal - No está abierto');
    return null;
  }

  const currentTransaction = editingData[currentTransactionIndex];

  // No mostrar el modal si no hay datos
  if (!groqData || !groqData.transacciones.length || !currentTransaction) {
    logger.debug('🚫 VoiceTransactionModal - No hay datos:', { 
      hasGroqData: !!groqData, 
      hasTransactions: groqData?.transacciones?.length,
      currentTransaction: !!currentTransaction 
    });
    return null;
  }

  // Función para determinar el texto del botón basado en los tipos de transacciones
  const getButtonText = (): string => {
    if (!groqData || !groqData.transacciones.length) return 'Guardar';
    
    const tipos = groqData.transacciones.map(t => t.tipo).filter(Boolean);
    const esMultiple = groqData.transacciones.length > 1;
    
    if (tipos.length === 0) return 'Guardar';
    
    // Si todas las transacciones son del mismo tipo
    const todosGastos = tipos.every(tipo => tipo === 'gasto');
    const todosIngresos = tipos.every(tipo => tipo === 'ingreso');
    
    if (todosGastos) {
      return esMultiple ? 'Registrar Gastos' : 'Registrar Gasto';
    } else if (todosIngresos) {
      return esMultiple ? 'Registrar Ingresos' : 'Registrar Ingreso';
    } else {
      // Mezcla de gastos e ingresos
      return 'Registrar Transacciones';
    }
  };

  // Función para determinar el color del botón basado en los tipos de transacciones
  const getButtonColor = (): string => {
    if (!groqData || !groqData.transacciones.length) return 'bg-gradient-to-r from-green-500 to-green-600';
    
    const tipos = groqData.transacciones.map(t => t.tipo).filter(Boolean);
    
    if (tipos.length === 0) return 'bg-gradient-to-r from-green-500 to-green-600';
    
    // Si todas las transacciones son del mismo tipo
    const todosGastos = tipos.every(tipo => tipo === 'gasto');
    const todosIngresos = tipos.every(tipo => tipo === 'ingreso');
    
    if (todosGastos) {
      return 'bg-gradient-to-r from-red-500 to-orange-500';
    } else if (todosIngresos) {
      return 'bg-gradient-to-r from-green-500 to-green-600';
    } else {
      // Mezcla de gastos e ingresos - usar color neutro
      return 'bg-gradient-to-r from-blue-500 to-purple-600';
    }
  };


  const handleSaveChanges = () => {
    // Solo cambiar a modo de confirmación sin guardar completamente
    setIsEditing(false);
  };

  const handleSave = async () => {
    logger.debug('🚀 handleSave iniciado');
    logger.debug('📊 editingData:', editingData);
    logger.debug('📊 editingData.length:', editingData.length);
    
    if (editingData.length > 0) {
      logger.debug('✅ Hay datos para guardar, iniciando proceso...');
      setIsSaving(true);
      setSaveError(null); // Limpiar error anterior
      
      try {
        logger.debug('🔄 Guardando transacciones sin agrupar...');
        
        const updatedGroqData = {
          ...groqData!,
          transacciones: editingData
        };
        
        logger.debug('📤 Datos preparados para guardar:', updatedGroqData);
        
        // Guardar directamente en Supabase usando la misma lógica del dashboard
        logger.debug('💾 Guardando directamente en Supabase...');
        
        if (!user) {
          throw new Error('Usuario no autenticado');
        }
        
        for (let i = 0; i < editingData.length; i++) {
          const transaction = editingData[i];
          logger.debug(`🔄 Procesando transacción ${i + 1} de ${editingData.length}...`);
          
          // SOLUCIÓN: Usar la fecha de la transacción o getTodayForCountry() (fecha correcta del país)
          const countryCode = country || 'BO'; // Default a Bolivia si no hay país
          const transactionDate = transaction.fecha || getTodayForCountry(countryCode);
          
          // VALIDACIÓN: Verificar que la fecha sea solo ayer o hoy
          const validation = validateTransactionDate(transactionDate, countryCode);
          if (!validation.valid) {
            logger.error(`❌ Validación de fecha fallida para transacción ${i + 1}:`, validation.message);
            throw new Error(validation.message || 'La fecha debe ser ayer o hoy');
          }
          
          const now = new Date();
          const [year, month, day] = transactionDate.split('-').map(Number);
          
          // Obtener hora, minuto y segundo en la zona horaria del país del usuario
          const timeZone = getTimezoneForCountry(countryCode);
          
          // Obtener la hora actual en la zona horaria del país
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          
          const timeParts = formatter.formatToParts(now);
          const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0', 10);
          const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0', 10);
          const second = parseInt(timeParts.find(p => p.type === 'second')?.value || '0', 10);
          
          // Construir la fecha ISO respetando la zona horaria del país
          const dateISO = buildISODateForCountry(year, month, day, hour, minute, second, countryCode);
          
          const transactionData = {
            tipo: (transaction.tipo === 'gasto' ? 'gasto' : 'ingreso') as 'gasto' | 'ingreso',
            monto: parseFloat(transaction.monto?.toString() || '0'),
            categoria: transaction.categoria || 'otros',
            descripcion: transaction.descripcion || '',
            fecha: dateISO,
            url_comprobante: undefined
          };
          
          logger.debug('💾 Guardando transacción individual:', transactionData);
          logger.debug('📅 Fecha procesada:', {
            fechaOriginal: transaction.fecha,
            fechaConHora: dateISO,
            horaActual: now.toISOString(),
            zonaHoraria: timeZone,
            pais: countryCode
          });
          logger.debug('👤 Usuario ID:', user.id);
          logger.debug('📊 Datos completos que se enviarán:', {
            ...transactionData,
            usuario_id: user.id
          });
          
          try {
            const result = await addTransaction(transactionData);
            logger.debug('✅ addTransaction resultado:', result);
            logger.debug(`✅ Transacción ${i + 1} guardada exitosamente`);
          } catch (transactionError) {
            logger.error(`❌ Error al guardar transacción ${i + 1}:`, transactionError);
            logger.error('❌ Mensaje de error:', (transactionError as Error).message);
            logger.error('❌ Error code:', (transactionError as any).errorCode);
            // Re-lanzar el error para que se capture en el catch externo
            throw transactionError;
          }
        }
        
        logger.debug('✅ Todas las transacciones guardadas exitosamente');
        
        // Mostrar estado de éxito brevemente
        setSaveSuccess(true);
        
        // Si hay un pago de deuda detectado y seleccionado, aplicar el pago
        const currentTransaction = editingData[currentTransactionIndex];
        if (currentTransaction?.esPagoDeuda && selectedDebt && currentTransaction.monto) {
          // Aquí podrías agregar lógica adicional para actualizar la deuda
          // Por ejemplo, llamar a una función para registrar el pago
        }
        
        // Esperar un momento para mostrar el estado de éxito antes de cerrar
        setTimeout(() => {
          onClose();
        }, 1500);
        
      } catch (error) {
        logger.error('❌ Error guardando transacciones:', error);
        logger.error('❌ Tipo de error:', typeof error);
        logger.error('❌ Mensaje de error:', (error as Error).message);
        logger.error('❌ Stack trace:', (error as Error).stack);
        setIsSaving(false); // Solo resetear si hay error
        setSaveSuccess(false);
        
        // Mostrar el mensaje de error al usuario
        const errorMessage = (error as Error).message || 'Error al guardar la transacción. Por favor, intenta de nuevo.';
        setSaveError(errorMessage);
      }
    }
  };

  const handleCancel = () => {
    setIsSaving(false);
    setSaveSuccess(false);
    setSaveError(null); // Limpiar error al cancelar
    onCancel();
    onClose();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // Restaurar los datos originales desde groqData
    if (groqData && groqData.transacciones.length > 0) {
      const transactionsWithDefaultPayment = groqData.transacciones.map(transaction => ({
        ...transaction,
        metodoPago: transaction.metodoPago || 'efectivo'
      }));
      setEditingData(transactionsWithDefaultPayment);
      // Restaurar el valor del input de monto para la transacción actual
      setAmountInputValue(transactionsWithDefaultPayment[currentTransactionIndex]?.monto?.toString() || '');
      logger.debug('🔄 Edición cancelada - Datos restaurados');
    }
    setIsEditing(false);
    setIsSaving(false);
    setSaveSuccess(false);
  };

  const handleFieldChange = (field: keyof GroqTransaction, value: any) => {
    if (currentTransaction) {
      const updatedTransactions = [...editingData];
      updatedTransactions[currentTransactionIndex] = {
        ...currentTransaction,
        [field]: value
      };
      setEditingData(updatedTransactions);
    }
  };

  const handlePreviousTransaction = () => {
    if (currentTransactionIndex > 0) {
      setCurrentTransactionIndex(currentTransactionIndex - 1);
    }
  };

  const handleNextTransaction = () => {
    if (currentTransactionIndex < editingData.length - 1) {
      setCurrentTransactionIndex(currentTransactionIndex + 1);
    }
  };

  // Función para validar si se puede guardar
  const canSave = () => {
    if (isEditing) {
      // En modo edición, ser más permisivo
      // Solo requerir que haya algún dato en la transacción
      return currentTransaction && (
        currentTransaction.monto !== null || 
        currentTransaction.tipo !== null ||
        currentTransaction.categoria !== null ||
        currentTransaction.descripcion !== null
      );
    } else {
      // En modo confirmación, validar que haya datos básicos
      return currentTransaction?.monto && currentTransaction?.tipo;
    }
  };

  // Funciones para swipe gesture
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentTransactionIndex < editingData.length - 1) {
      // Swipe izquierda = siguiente transacción
      handleNextTransaction();
    }
    if (isRightSwipe && currentTransactionIndex > 0) {
      // Swipe derecha = transacción anterior
      handlePreviousTransaction();
    }
  };

  const getCategoryColor = (categoria: string | null) => {
    const colors: Record<string, string> = {
      comida: 'bg-green-100 text-green-800',
      transporte: 'bg-blue-100 text-blue-800',
      educacion: 'bg-purple-100 text-purple-800',
      tecnologia: 'bg-indigo-100 text-indigo-800',
      salud: 'bg-red-100 text-red-800',
      entretenimiento: 'bg-yellow-100 text-yellow-800',
      servicios: 'bg-gray-100 text-gray-800',
      ropa: 'bg-pink-100 text-pink-800',
      hogar: 'bg-orange-100 text-orange-800',
      otros: 'bg-slate-100 text-slate-800'
    };
    return colors[categoria || 'otros'] || colors.otros;
  };

  const getMetodoPagoColor = (metodo: string | null) => {
    const colors: Record<string, string> = {
      efectivo: 'bg-green-100 text-green-800',
      tarjeta: 'bg-blue-100 text-blue-800',
      transferencia: 'bg-purple-100 text-purple-800',
      cheque: 'bg-yellow-100 text-yellow-800',
      crypto: 'bg-orange-100 text-orange-800',
      otro: 'bg-gray-100 text-gray-800'
    };
    return colors[metodo || 'efectivo'] || colors.efectivo;
  };

  // Funciones para obtener iconos
  const getTipoIcon = (tipo: string | null) => {
    return tipo === 'ingreso' ? <TrendingUp size={16} /> : <TrendingDown size={16} />;
  };

  const getMetodoPagoIcon = (metodo: string | null) => {
    const icons: Record<string, React.ReactElement> = {
      efectivo: <CreditCard size={16} />,
      tarjeta: <CreditCard size={16} />,
      transferencia: <CreditCard size={16} />,
      cheque: <CreditCard size={16} />,
      crypto: <CreditCard size={16} />,
      otro: <CreditCard size={16} />
    };
    return icons[metodo || 'efectivo'] || icons.efectivo;
  };

  const getCategoriaIcon = (categoria: string | null) => {
    const icons: Record<string, React.ReactElement> = {
      comida: <ShoppingCart size={16} />,
      transporte: <Car size={16} />,
      educacion: <GraduationCap size={16} />,
      tecnologia: <Wrench size={16} />,
      salud: <Heart size={16} />,
      entretenimiento: <Gamepad2 size={16} />,
      servicios: <Wrench size={16} />,
      ropa: <Shirt size={16} />,
      hogar: <Home size={16} />,
      otros: <ShoppingCart size={16} />
    };
    return icons[categoria || 'otros'] || icons.otros;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        ref={modalRef}
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] flex flex-col"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        {/* Header fijo */}
        <div className="flex-shrink-0">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            source === 'text' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {source === 'text' ? (
              <Type size={32} className="text-green-600" />
            ) : (
              <Mic size={32} className="text-blue-600" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {source === 'text' ? 'Transacción por Texto' : 'Transacción de Voz'}
          </h3>
          
          {groqData && groqData.esMultiple && (
            <div className="flex flex-col items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                Transacción {currentTransactionIndex + 1} de {groqData.transacciones.length}
              </span>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">← Desliza para navegar →</div>
              </div>
              {/* Indicadores de puntos */}
              <div className="flex gap-2">
                {groqData.transacciones.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTransactionIndex 
                        ? 'bg-blue-500' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-4 mb-6">
            
            {/* Datos procesados */}
            {currentTransaction && (
              <div className="space-y-4">
                
                {/* Monto */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Monto ({userCurrency.plural}) *
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={amountInputValue}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir cualquier entrada
                        setAmountInputValue(value);
                        
                        // Intentar convertir a número si es posible
                        const normalizedValue = value.replace(',', '.');
                        const numValue = normalizedValue === '' ? null : parseFloat(normalizedValue);
                        
                        // Solo actualizar el estado si es un número válido
                        if (normalizedValue === '' || !isNaN(numValue || 0)) {
                          handleFieldChange('monto', numValue);
                        }
                      }}
                      onBlur={(e) => {
                        // Al perder el foco, formatear el número correctamente
                        const value = e.target.value;
                        if (value && !isNaN(parseFloat(value.replace(',', '.')))) {
                          const numValue = parseFloat(value.replace(',', '.'));
                          setAmountInputValue(numValue.toString());
                          handleFieldChange('monto', numValue);
                        }
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      {currentTransaction.monto ? `Bs. ${currentTransaction.monto.toFixed(2)}` : 'No detectado'}
                    </div>
                  )}
                </div>

                {/* Fecha - Solo mostrar si Groq detectó una fecha pasada específica */}
                {(() => {
                  logger.debug('📅 Modal - currentTransaction.fecha:', currentTransaction.fecha);
                  return null;
                })()}
                {currentTransaction.fecha && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Fecha *
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={currentTransaction.fecha}
                        onChange={(e) => handleFieldChange('fecha', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
                      />
                    ) : (
                      <div className="text-lg font-medium text-gray-900">
                        {(() => {
                          // Crear fecha en zona horaria local para evitar problemas de UTC
                          const [year, month, day] = currentTransaction.fecha.split('-').map(Number);
                          const localDate = new Date(year, month - 1, day);
                          return localDate.toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Tipo */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Tipo de Transacción *
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={currentTransaction.tipo || ''}
                        onChange={(e) => handleFieldChange('tipo', e.target.value as 'gasto' | 'ingreso' | null)}
                        className="w-full px-4 py-3 pr-10 rounded-xl bg-white border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                      >
                        <option value="" className="text-gray-500">Seleccionar tipo...</option>
                        <option value="gasto" className="text-gray-900">Gasto</option>
                        <option value="ingreso" className="text-gray-900">Ingreso</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={20} className="text-gray-500" />
                      </div>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      currentTransaction.tipo === 'gasto' 
                        ? 'bg-red-100 text-red-800' 
                        : currentTransaction.tipo === 'ingreso'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {currentTransaction.tipo === 'gasto' ? 'Gasto' : 
                       currentTransaction.tipo === 'ingreso' ? 'Ingreso' : 'No detectado'}
                    </div>
                  )}
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={currentTransaction.metodoPago || 'efectivo'}
                        onChange={(e) => handleFieldChange('metodoPago', e.target.value || 'efectivo')}
                        className="w-full px-4 py-3 pr-10 rounded-xl bg-white border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                      >
                        {METODOS_PAGO_DISPONIBLES.map(metodo => (
                          <option key={metodo} value={metodo} className="text-gray-900">
                            {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={20} className="text-gray-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-900 text-sm">
                      {currentTransaction.metodoPago ? currentTransaction.metodoPago.charAt(0).toUpperCase() + currentTransaction.metodoPago.slice(1) : 'Efectivo'}
                    </div>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Categoría
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <select
                        value={currentTransaction.categoria || ''}
                        onChange={(e) => handleFieldChange('categoria', e.target.value || null)}
                        className="w-full px-4 py-3 pr-10 rounded-xl bg-white border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-medium appearance-none cursor-pointer"
                      >
                        <option value="" className="text-gray-500">Seleccionar categoría...</option>
                        {CATEGORIAS_DISPONIBLES.map(cat => (
                          <option key={cat} value={cat} className="text-gray-900">
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <ChevronDown size={20} className="text-gray-500" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-900 text-sm">
                      {currentTransaction.categoria ? currentTransaction.categoria.charAt(0).toUpperCase() + currentTransaction.categoria.slice(1) : 'No detectada'}
                    </div>
                  )}
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Descripción
                  </label>
                  {isEditing ? (
                    <textarea
                      value={currentTransaction.descripcion || ''}
                      onChange={(e) => handleFieldChange('descripcion', e.target.value || null)}
                      className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-300 focus:border-blue-500 focus:outline-none text-gray-900 font-medium resize-none"
                      rows={2}
                      placeholder="Descripción del gasto/ingreso..."
                    />
                  ) : (
                    <div className="text-gray-900 text-sm">
                      {currentTransaction.descripcion || 'No detectada'}
                    </div>
                  )}
                </div>

                {/* Información de Deuda */}
                {currentTransaction.esPagoDeuda && debtSearchResults.length > 0 && (
                  <div className={`border rounded-xl p-4 ${
                    currentTransaction.descripcion?.toLowerCase().includes('meta') || 
                    currentTransaction.descripcion?.toLowerCase().includes('ahorro') ||
                    currentTransaction.descripcion?.toLowerCase().includes('objetivo')
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' // Colores de metas
                      : 'bg-gradient-to-r from-red-600 to-orange-600 text-white' // Colores de deudas
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={16} className="text-white" />
                      <span className="text-sm font-bold text-white">Pago de Deuda Detectado</span>
                    </div>
                    
                    <div className="space-y-2">
                      {!selectedDebt && (
                        <p className="text-xs text-white/80">
                          Buscando: "{currentTransaction.nombreDeuda}"
                        </p>
                      )}
                      
                      {debtSearchResults.map((debt, index) => (
                        <div
                          key={debt.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedDebt?.id === debt.id
                              ? 'bg-white/20 border-white/40'
                              : 'bg-white/10 border-white/20 hover:bg-white/15'
                          }`}
                          onClick={() => setSelectedDebt(debt)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm text-white">{debt.nombre}</p>
                              <p className="text-xs text-white/80">
                                Restante: Bs. {debt.monto_restante.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-white font-medium">
                                {debt.coincidencia}% coincidencia
                              </p>
                              <div className="w-16 bg-white/20 rounded-full h-1.5 mt-1">
                                <div 
                                  className="bg-white h-1.5 rounded-full" 
                                  style={{ width: `${debt.coincidencia}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {selectedDebt && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-xs text-green-700 font-medium">
                            ✅ Pago aplicado a: {selectedDebt.nombre}
                          </p>
                          <p className="text-xs text-green-600">
                            Nuevo saldo: Bs. {(selectedDebt.monto_restante - (currentTransaction.monto || 0)).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error si no hay datos */}
            {!groqData && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <AlertCircle size={20} className="text-red-500" />
                <div>
                  <p className="font-medium text-red-900 text-sm">Error en procesamiento</p>
                  <p className="text-xs text-red-600">No se pudieron extraer los datos de la transcripción</p>
                </div>
              </div>
            )}
            
            {/* Error al guardar */}
            {saveError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200 mb-4">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 text-sm mb-1">Error al guardar</p>
                  <p className="text-xs text-red-700">{saveError}</p>
                </div>
                <button
                  onClick={() => setSaveError(null)}
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  aria-label="Cerrar error"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex-shrink-0 pt-4 border-t border-gray-100">
          <div className="flex gap-3">
            {isEditing ? (
              // Modo de edición: Cancelar Edición + Guardar
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all"
                >
                  Cancelar Edición
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={!canSave()}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all shadow-lg ${
                    canSave()
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Confirmar Cambios
                </button>
              </>
            ) : (
              // Modo de confirmación: Cancelar + Editar + Guardar
              <>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100 border border-red-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-all"
                >
                  Editar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave() || isSaving || saveSuccess}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all shadow-lg ${
                    saveSuccess
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : canSave() && !isSaving
                      ? `${getButtonColor()} text-white hover:opacity-90`
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {saveSuccess ? '✅ Guardado' : isSaving ? 'Guardando...' : getButtonText()}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
