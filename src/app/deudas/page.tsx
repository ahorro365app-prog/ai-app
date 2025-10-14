"use client";

import { useState, useEffect } from 'react';
import { Plus, CreditCard, Calendar, DollarSign, Trash2, Edit2, CheckCircle, History, Camera, Image, X, Pencil, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  description?: string;
  receipt?: string; // Base64 de la imagen del comprobante
}

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  createdAt: string;
  paymentHistory: PaymentRecord[];
  isMonthlyPayment?: boolean;
  monthlyPaymentDay?: number;
}

export default function DeudasPage() {
  const { formatAmount, currency } = useCurrency();
  const { user, debts: supabaseDebts, addDebt: addSupabaseDebt, updateDebt: updateSupabaseDebt, deleteDebt: deleteSupabaseDebt } = useSupabase();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [debtHistory, setDebtHistory] = useState<Debt | null>(null);
  const [celebratedMilestones, setCelebratedMilestones] = useState<Record<string, Set<number>>>({});
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [showDeletePaymentModal, setShowDeletePaymentModal] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<PaymentRecord | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  
  // Estados para el formulario
  const [debtName, setDebtName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isMonthlyPayment, setIsMonthlyPayment] = useState(false);
  const [monthlyPaymentDay, setMonthlyPaymentDay] = useState(1);

  // Cargar deudas guardadas
  useEffect(() => {
    if (user) {
      // Mapear datos de Supabase al formato esperado por la app
      const mappedDebts = supabaseDebts.map(debt => ({
        id: debt.id,
        name: debt.nombre,
        totalAmount: debt.monto_total,
        paidAmount: debt.monto_pagado,
        dueDate: debt.fecha_vencimiento || '',
        createdAt: debt.fecha_creacion || new Date().toISOString(),
        paymentHistory: debt.historial_pagos || [],
        isMonthlyPayment: debt.es_mensual || false,
        monthlyPaymentDay: debt.dia_mensual || undefined
      }));

      setDebts(mappedDebts);
    } else {
      setDebts([]);
    }
  }, [user, supabaseDebts]);

  // Cargar celebraciones ya realizadas
  useEffect(() => {
    // No cargar celebraciones de localStorage - usar estado por defecto
    setCelebratedMilestones({});
  }, []);

  // Verificar recordatorios al cargar
  useEffect(() => {
    if (debts.length > 0) {
      checkDueDateReminders();
    }
  }, [debts]);

  // Guardar deudas
  const saveDebts = (newDebts: Debt[]) => {
    setDebts(newDebts);
    // Las deudas se guardan automáticamente en Supabase a través de las funciones addDebt, updateDebt, deleteDebt
  };

  // Calcular días restantes
  const getDaysRemaining = (dueDate: string) => {
    if (!dueDate) return null; // Sin fecha de vencimiento
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Función para calcular la fecha del siguiente pago mensual
  const getNextMonthlyPaymentDate = (debt: Debt) => {
    if (!debt.isMonthlyPayment || !debt.monthlyPaymentDay) return null;
    
    const today = new Date();
    const currentDay = today.getDate();
    const targetDay = debt.monthlyPaymentDay;
    
    // Si ya pasó el día de pago este mes, calcular para el próximo mes
    if (currentDay > targetDay) {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);
      return nextMonth;
    } else {
      // Si aún no llega el día de pago este mes, usar este mes
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), targetDay);
      return thisMonth;
    }
  };

  // Manejar toggle de pago mensual
  const handleMonthlyPaymentToggle = (isMonthly: boolean) => {
    setIsMonthlyPayment(isMonthly);
    
    if (isMonthly) {
      // Calcular fecha del próximo mes con el día seleccionado
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, monthlyPaymentDay);
      setDueDate(nextMonth.toISOString().split('T')[0]);
    } else {
      // Si se desactiva, limpiar la fecha
      setDueDate('');
    }
  };

  // Manejar cambio de día del pago mensual
  const handleMonthlyPaymentDayChange = (day: number) => {
    setMonthlyPaymentDay(day);
    
    if (isMonthlyPayment) {
      // Recalcular fecha si el pago mensual está activo
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day);
      setDueDate(nextMonth.toISOString().split('T')[0]);
    }
  };

  // Agregar nueva deuda
  const handleAddDebt = async () => {
    if (debtName && totalAmount) {
      // Si el pago mensual está desactivado, no establecer fecha de finalización
      let finalDueDate = isMonthlyPayment ? dueDate : '';
      const newDebt: Debt = {
        id: Date.now().toString(),
        name: debtName,
        totalAmount: parseFloat(totalAmount),
        paidAmount: 0, // Siempre empezar en 0
        dueDate: finalDueDate,
        createdAt: new Date().toISOString(),
        paymentHistory: [], // Historial vacío inicialmente
        isMonthlyPayment: isMonthlyPayment,
        monthlyPaymentDay: isMonthlyPayment ? monthlyPaymentDay : undefined,
      };

      try {
        // Guardar en Supabase si está disponible
        if (user) {
          await addSupabaseDebt({
            nombre: newDebt.name,
            monto_total: newDebt.totalAmount,
            monto_pagado: newDebt.paidAmount,
            fecha_vencimiento: newDebt.dueDate || null,
            es_mensual: newDebt.isMonthlyPayment || false,
            dia_mensual: newDebt.monthlyPaymentDay || null,
            historial_pagos: newDebt.paymentHistory
          });
          // Los datos se actualizarán automáticamente a través del useEffect
        } else {
          // Fallback a localStorage
          const newDebts = [...debts, newDebt];
          saveDebts(newDebts);
        }
        
        // Limpiar formulario
        setDebtName('');
        setTotalAmount('');
        setDueDate('');
        setIsMonthlyPayment(false);
        setMonthlyPaymentDay(1);
        setShowAddDebtModal(false);
      } catch (error) {
        console.error('Error saving debt:', error);
        // Fallback a localStorage si hay error
        const newDebts = [...debts, newDebt];
        saveDebts(newDebts);
        
        setDebtName('');
        setTotalAmount('');
        setDueDate('');
        setIsMonthlyPayment(false);
        setMonthlyPaymentDay(1);
        setShowAddDebtModal(false);
      }
    }
  };

  // Mostrar modal de confirmación para eliminar
  const handleDeleteClick = (debt: Debt) => {
    setDebtToDelete(debt);
    setShowDeleteConfirmModal(true);
  };

  // Eliminar deuda confirmada
  const handleConfirmDelete = () => {
    if (debtToDelete) {
      const newDebts = debts.filter(debt => debt.id !== debtToDelete.id);
      saveDebts(newDebts);
      setShowDeleteConfirmModal(false);
      setDebtToDelete(null);
    }
  };

  // Cancelar eliminación
  const handleCancelDelete = () => {
    setShowDeleteConfirmModal(false);
    setDebtToDelete(null);
  };

  // Mostrar celebración
  const showCelebrationToast = (message: string) => {
    setCelebrationMessage(message);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationMessage('');
    }, 4000);
  };

  // Mostrar recordatorio
  const showReminderToast = (message: string) => {
    setReminderMessage(message);
    setShowReminder(true);
    setTimeout(() => {
      setShowReminder(false);
      setReminderMessage('');
    }, 5000);
  };

  // Verificar celebraciones por progreso (solo la primera vez)
  const checkProgressCelebrations = (debt: Debt) => {
    const progress = (debt.paidAmount / debt.totalAmount) * 100;
    const debtId = debt.id;
    
    // Inicializar Set para esta deuda si no existe
    if (!celebratedMilestones[debtId]) {
      celebratedMilestones[debtId] = new Set();
    }
    
    // Verificar cada milestone y celebrar solo si es la primera vez
    if (progress >= 100 && !celebratedMilestones[debtId].has(100)) {
      celebratedMilestones[debtId].add(100);
      showCelebrationToast(`🎉 ¡FELICITACIONES! ¡Has pagado completamente "${debt.name}"! ¡Eres libre de deudas! 🎉`);
    } else if (progress >= 75 && !celebratedMilestones[debtId].has(75)) {
      celebratedMilestones[debtId].add(75);
      showCelebrationToast(`🎊 ¡Increíble! Has pagado el 75% de "${debt.name}". ¡Ya casi terminas! 🎊`);
    } else if (progress >= 50 && !celebratedMilestones[debtId].has(50)) {
      celebratedMilestones[debtId].add(50);
      showCelebrationToast(`🎉 ¡Felicidades! Has pagado el 50% de "${debt.name}". ¡Vas por buen camino! 🎉`);
    } else if (progress >= 25 && !celebratedMilestones[debtId].has(25)) {
      celebratedMilestones[debtId].add(25);
      showCelebrationToast(`🎈 ¡Bien hecho! Has pagado el 25% de "${debt.name}". ¡Sigue así! 🎈`);
    }
    
    // Guardar celebraciones en localStorage
    const celebrationsToSave: Record<string, number[]> = {};
    Object.keys(celebratedMilestones).forEach(key => {
      celebrationsToSave[key] = Array.from(celebratedMilestones[key]);
    });
    // No guardar celebraciones en localStorage - usar estado local
  };

  // Verificar recordatorios de vencimiento
  const checkDueDateReminders = () => {
    debts.forEach(debt => {
      if (debt.dueDate) {
        let daysRemaining;
        let paymentType;
        
        if (debt.isMonthlyPayment && debt.monthlyPaymentDay) {
          const nextPaymentDate = getNextMonthlyPaymentDate(debt);
          daysRemaining = nextPaymentDate ? getDaysRemaining(nextPaymentDate.toISOString().split('T')[0]) : null;
          paymentType = "próximo pago";
        } else {
          daysRemaining = getDaysRemaining(debt.dueDate);
          paymentType = "vencimiento";
        }
        
        if (daysRemaining !== null) {
          if (daysRemaining <= 0) {
            showReminderToast(`⚠️ ¡ATENCIÓN! La deuda "${debt.name}" está VENCIDA. Págala cuanto antes. ⚠️`);
          } else if (daysRemaining <= 3) {
            showReminderToast(`⏰ Tu deuda "${debt.name}" ${paymentType} es en ${daysRemaining} días. ¡No olvides pagarla! ⏰`);
          } else if (daysRemaining <= 7) {
            showReminderToast(`📅 Recordatorio: Tu deuda "${debt.name}" ${paymentType} es en ${daysRemaining} días. 📅`);
          }
        }
      }
    });
  };

  // Mostrar modal de pago
  const handlePaymentClick = (debt: Debt) => {
    setDebtToPay(debt);
    setPaymentAmount('');
    setShowPaymentModal(true);
  };

  // Abrir modal de historial
  const handleShowHistory = (debt: Debt) => {
    setDebtHistory(debt);
    setShowHistoryModal(true);
  };

  // Cerrar modal de historial
  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setDebtHistory(null);
  };

  // Abrir opciones de comprobante
  const handleReceiptClick = () => {
    setShowReceiptOptions(true);
  };

  // Cerrar opciones de comprobante
  const handleCloseReceiptOptions = () => {
    setShowReceiptOptions(false);
  };

  // Manejar selección de imagen desde galería
  const handleSelectFromGallery = () => {
    setShowReceiptOptions(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPaymentReceipt(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Manejar captura de foto
  const handleTakePhoto = () => {
    setShowReceiptOptions(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Usar cámara trasera en móviles
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPaymentReceipt(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Eliminar comprobante
  const handleRemoveReceipt = () => {
    setPaymentReceipt(null);
  };

  // Mostrar comprobante en modal
  const handleShowReceipt = (image: string) => {
    setReceiptImage(image);
    setShowReceiptModal(true);
  };

  // Cerrar modal de comprobante
  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setReceiptImage(null);
  };

  // Abrir modal para editar pago
  const handleEditPayment = (payment: PaymentRecord) => {
    setPaymentToEdit(payment);
    setEditPaymentAmount(payment.amount.toString());
    setShowEditPaymentModal(true);
  };

  // Cerrar modal de edición
  const handleCloseEditPayment = () => {
    setShowEditPaymentModal(false);
    setPaymentToEdit(null);
    setEditPaymentAmount('');
  };

  // Guardar edición de pago
  const handleSaveEditPayment = () => {
    if (paymentToEdit && editPaymentAmount && debtHistory) {
      const newAmount = parseFloat(editPaymentAmount);
      const oldAmount = paymentToEdit.amount;
      const difference = newAmount - oldAmount;

      // Actualizar el historial de pagos
      const updatedPaymentHistory = debtHistory.paymentHistory.map(payment =>
        payment.id === paymentToEdit.id
          ? { ...payment, amount: newAmount }
          : payment
      );

      // Actualizar el monto total pagado
      const newTotalPaid = Math.max(0, debtHistory.paidAmount + difference);

      // Actualizar la deuda
      const updatedDebts = debts.map(debt =>
        debt.id === debtHistory.id
          ? {
              ...debt,
              paidAmount: newTotalPaid,
              paymentHistory: updatedPaymentHistory
            }
          : debt
      );

      saveDebts(updatedDebts);
      
      // Actualizar el estado local del historial
      setDebtHistory({
        ...debtHistory,
        paidAmount: newTotalPaid,
        paymentHistory: updatedPaymentHistory
      });

      // Verificar celebraciones con la deuda actualizada
      const updatedDebt = updatedDebts.find(d => d.id === debtHistory.id);
      if (updatedDebt) {
        checkProgressCelebrations(updatedDebt);
      }

      handleCloseEditPayment();
    }
  };

  // Abrir modal para eliminar pago
  const handleDeletePayment = (payment: PaymentRecord) => {
    setPaymentToDelete(payment);
    setShowDeletePaymentModal(true);
  };

  // Cerrar modal de eliminación
  const handleCloseDeletePayment = () => {
    setShowDeletePaymentModal(false);
    setPaymentToDelete(null);
  };

  // Confirmar eliminación de pago
  const handleConfirmDeletePayment = () => {
    if (paymentToDelete && debtHistory) {
      const amountToSubtract = paymentToDelete.amount;

      // Eliminar el pago del historial
      const updatedPaymentHistory = debtHistory.paymentHistory.filter(
        payment => payment.id !== paymentToDelete.id
      );

      // Actualizar el monto total pagado
      const newTotalPaid = Math.max(0, debtHistory.paidAmount - amountToSubtract);

      // Actualizar la deuda
      const updatedDebts = debts.map(debt =>
        debt.id === debtHistory.id
          ? {
              ...debt,
              paidAmount: newTotalPaid,
              paymentHistory: updatedPaymentHistory
            }
          : debt
      );

      saveDebts(updatedDebts);
      
      // Actualizar el estado local del historial
      setDebtHistory({
        ...debtHistory,
        paidAmount: newTotalPaid,
        paymentHistory: updatedPaymentHistory
      });

      // Verificar celebraciones con la deuda actualizada
      const updatedDebt = updatedDebts.find(d => d.id === debtHistory.id);
      if (updatedDebt) {
        checkProgressCelebrations(updatedDebt);
      }

      handleCloseDeletePayment();
    }
  };

  // Registrar pago
  const handleRegisterPayment = () => {
    if (debtToPay && paymentAmount) {
      const paymentValue = parseFloat(paymentAmount);
      const newPaidAmount = debtToPay.paidAmount + paymentValue;
      
      // Crear registro del pago
      const paymentRecord: PaymentRecord = {
        id: Date.now().toString(),
        amount: paymentValue,
        date: new Date().toISOString(),
        description: `Pago registrado el ${new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}, ${new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        receipt: paymentReceipt || undefined
      };
      
      // Actualizar la deuda con el nuevo pago en el historial
      const updatedDebts = debts.map(debt => 
        debt.id === debtToPay.id 
          ? { 
              ...debt, 
              paidAmount: Math.min(newPaidAmount, debt.totalAmount),
              paymentHistory: [...(debt.paymentHistory || []), paymentRecord]
            }
          : debt
      );
      
      saveDebts(updatedDebts);
      
      // Verificar celebraciones
      const updatedDebt = { ...debtToPay, paidAmount: Math.min(newPaidAmount, debtToPay.totalAmount) };
      checkProgressCelebrations(updatedDebt);
      
      // Cerrar modal y limpiar estados
      setShowPaymentModal(false);
      setDebtToPay(null);
      setPaymentAmount('');
      setPaymentReceipt(null);
    }
  };

  // Calcular totales
  const totalDebt = debts.reduce((sum, debt) => sum + debt.totalAmount, 0);
  const totalPaid = debts.reduce((sum, debt) => sum + debt.paidAmount, 0);
  const remainingDebt = totalDebt - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-sm font-bold text-gray-900 mb-1">Mis Deudas</h1>
        <p className="text-gray-600">Gestiona tus préstamos y pagos pendientes</p>
      </div>

      {/* Resumen principal */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-red-100 text-sm mb-1">Total de deudas</p>
            <p className="text-base font-bold">{formatAmount(totalDebt)}</p>
          </div>
          <div className="text-right">
            <p className="text-red-100 text-sm mb-1">Restante</p>
            <p className="text-base font-bold">{formatAmount(remainingDebt)}</p>
          </div>
        </div>
        
        {/* Barra de progreso general */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-red-100">Progreso general</span>
            <span className="font-medium">{totalDebt > 0 ? ((totalPaid / totalDebt) * 100).toFixed(1) : 0}%</span>
          </div>
          <div className="w-full bg-red-300/30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${Math.min((totalPaid / totalDebt) * 100, 100)}%` }}
            />
          </div>
        </div>
        
        <p className="text-red-100 text-xs">
          {debts.length} {debts.length === 1 ? 'deuda' : 'deudas'} registrada{debts.length === 1 ? '' : 's'}
        </p>
      </div>


      {/* Lista de deudas */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <CreditCard size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">No tienes deudas registradas</h3>
          <p className="text-gray-600 mb-6">Agrega tus préstamos para llevar un control detallado</p>
          <button
            onClick={() => setShowAddDebtModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Agregar Primera Deuda
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {debts
            .sort((a, b) => {
              // Primero: deudas sin fecha de vencimiento (siempre arriba)
              const aHasDate = a.dueDate && a.dueDate.trim() !== '';
              const bHasDate = b.dueDate && b.dueDate.trim() !== '';
              
              if (!aHasDate && bHasDate) return -1; // a va primero (sin fecha)
              if (aHasDate && !bHasDate) return 1;  // b va primero (sin fecha)
              
              // Si ambas tienen fecha o ambas no tienen fecha, ordenar por días restantes
              const aDaysRemaining = a.isMonthlyPayment && a.monthlyPaymentDay ? 
                (() => {
                  const nextPaymentDate = getNextMonthlyPaymentDate(a);
                  return nextPaymentDate ? getDaysRemaining(nextPaymentDate.toISOString().split('T')[0]) : null;
                })() : 
                getDaysRemaining(a.dueDate);
              
              const bDaysRemaining = b.isMonthlyPayment && b.monthlyPaymentDay ? 
                (() => {
                  const nextPaymentDate = getNextMonthlyPaymentDate(b);
                  return nextPaymentDate ? getDaysRemaining(nextPaymentDate.toISOString().split('T')[0]) : null;
                })() : 
                getDaysRemaining(b.dueDate);
              
              // Si alguna no tiene días calculables, ponerla al final
              if (aDaysRemaining === null && bDaysRemaining === null) return 0;
              if (aDaysRemaining === null) return 1;
              if (bDaysRemaining === null) return -1;
              
              // Ordenar por días restantes (menos días primero)
              return aDaysRemaining - bDaysRemaining;
            })
            .map((debt) => {
            const remaining = debt.totalAmount - debt.paidAmount;
            const daysRemaining = debt.isMonthlyPayment && debt.monthlyPaymentDay ? 
              (() => {
                const nextPaymentDate = getNextMonthlyPaymentDate(debt);
                return nextPaymentDate ? getDaysRemaining(nextPaymentDate.toISOString().split('T')[0]) : null;
              })() : 
              getDaysRemaining(debt.dueDate);
            const progress = (debt.paidAmount / debt.totalAmount) * 100;

            // Determinar estado y colores de la deuda
            const getDebtStatus = (daysRemaining: number | null) => {
              if (daysRemaining === null) return { status: 'sin-fecha', color: 'blue', icon: '📅', label: 'Sin fecha' };
              if (daysRemaining < 0) return { status: 'vencido', color: 'red', icon: '⚠️', label: 'Vencido' };
              if (daysRemaining <= 3) return { status: 'urgente', color: 'orange', icon: '🔥', label: 'Urgente' };
              if (daysRemaining <= 7) return { status: 'proximo', color: 'yellow', icon: '⏰', label: 'Próximo' };
              return { status: 'lejano', color: 'green', icon: '✅', label: 'Lejano' };
            };

            const debtStatus = getDebtStatus(daysRemaining);

            return (
              <div key={debt.id} className={`rounded-3xl p-6 shadow-sm border-2 transition-all duration-200 hover:shadow-md ${
                debtStatus.color === 'red' ? 'bg-red-50 border-red-200' :
                debtStatus.color === 'orange' ? 'bg-orange-50 border-orange-200' :
                debtStatus.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                debtStatus.color === 'blue' ? 'bg-blue-50 border-blue-200' :
                'bg-white border-gray-100'
              }`}>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">{debt.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaymentClick(debt)}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors rounded-xl hover:bg-green-50"
                      title="Registrar pago"
                    >
                      <DollarSign size={18} />
                    </button>
                    <button
                      onClick={() => handleShowHistory(debt)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-xl hover:bg-blue-50"
                      title="Ver historial de pagos"
                    >
                      <History size={18} />
                    </button>
                  </div>
                </div>

                {/* Barra de progreso mejorada */}
                <div className="mb-5">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">Progreso</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        progress === 100 ? 'bg-green-100 text-green-700' :
                        progress >= 75 ? 'bg-blue-100 text-blue-700' :
                        progress >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        progress >= 25 ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {progress === 100 ? '🎉 ¡Completado!' : `${progress.toFixed(1)}% completado`}
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3 shadow-inner">
                    {/* Marcadores de porcentajes */}
                    <div className="absolute inset-0 flex justify-between items-center">
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="w-px h-4 bg-gray-300"></div>
                      <div className="w-px h-4 bg-gray-300"></div>
                    </div>
                    {/* Etiquetas de porcentajes */}
                    <div className="absolute -top-7 w-full flex justify-between text-xs text-gray-500 font-medium">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    {/* Barra de progreso con gradiente mejorado */}
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 relative z-10 shadow-sm ${
                        progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        progress >= 75 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                        progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        progress >= 25 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>


                {/* Información financiera */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="font-bold text-red-600 text-xs">{formatAmount(debt.totalAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Pagado</p>
                    <p className="font-bold text-green-600 text-xs">{formatAmount(debt.paidAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Restante</p>
                    <p className="font-bold text-orange-600 text-xs">{formatAmount(remaining)}</p>
                  </div>
                </div>

                {/* Fecha de vencimiento o próximo pago */}
                <div className="relative mt-4">
                  {debt.dueDate ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {debt.isMonthlyPayment ? (
                            <>Siguiente pago: {(() => {
                              const nextPaymentDate = getNextMonthlyPaymentDate(debt);
                              return nextPaymentDate ? nextPaymentDate.toLocaleDateString('es-ES') : new Date(debt.dueDate).toLocaleDateString('es-ES');
                            })()}</>
                          ) : (
                            <>Vence: {new Date(debt.dueDate).toLocaleDateString('es-ES')}</>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-start">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          daysRemaining < 0 
                            ? 'bg-red-100 text-red-600' 
                            : daysRemaining < 7 
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          {daysRemaining < 0 ? 'Vencido' : `Falta ${daysRemaining} días`}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-600">Sin fecha de vencimiento</span>
                      <span className="text-xs px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-600">
                        Sin límite
                      </span>
                    </div>
                  )}
                  
                  {/* Botón eliminar en esquina inferior derecha */}
                  <button
                    onClick={() => handleDeleteClick(debt)}
                    className="absolute bottom-0 right-0 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    title="Eliminar deuda"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Botón flotante para agregar */}
          <button
            onClick={() => setShowAddDebtModal(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Modal para agregar deuda */}
      {showAddDebtModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header fijo */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <CreditCard size={32} className="text-red-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Nueva Deuda
              </h3>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Nombre de la deuda *
                </label>
                <input
                  type="text"
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  placeholder="Préstamo personal, tarjeta de crédito..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none modal-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Monto total *
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none modal-input"
                />
              </div>

              {/* Toggle de pago mensual */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Calendar size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pago mensual</p>
                    <p className="text-xs text-gray-600">¿Esta deuda se paga mensualmente?</p>
                  </div>
                </div>
                <button
                  onClick={() => handleMonthlyPaymentToggle(!isMonthlyPayment)}
                  className={`
                    relative w-12 h-6 rounded-full transition-all duration-200 ease-in-out
                    ${isMonthlyPayment 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                      : 'bg-gray-300'
                    }
                  `}
                >
                  <div
                    className={`
                      absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 ease-in-out shadow-md
                      ${isMonthlyPayment ? 'transform translate-x-6' : ''}
                    `}
                  />
                </button>
              </div>

              {/* Selector de día del mes */}
              {isMonthlyPayment && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Calendar size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Día del mes</p>
                      <p className="text-xs text-gray-600">Selecciona qué día de cada mes se debe pagar</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-8 gap-2">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => handleMonthlyPaymentDayChange(day)}
                        className={`
                          w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200
                          ${monthlyPaymentDay === day
                            ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white shadow-md scale-110'
                            : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:scale-105'
                          }
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <Calendar size={12} />
                    Próximo pago: día {monthlyPaymentDay} del próximo mes
                  </p>
                </div>
              )}
            </div>
            </div>

            {/* Footer fijo */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddDebtModal(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddDebt}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
                >
                  Agregar Deuda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirmModal && debtToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Eliminar Deuda</h3>
                <p className="text-xs text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que quieres eliminar la deuda <strong>"{debtToDelete.name}"</strong>?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-600 text-xs">⚠️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-xs mb-1">Advertencia</p>
                    <p className="text-red-700 text-xs">
                      Esta acción eliminará permanentemente todos los datos de la deuda, incluyendo:
                    </p>
                    <ul className="text-red-700 text-xs mt-2 list-disc list-inside space-y-1">
                      <li>Monto total: {formatAmount(debtToDelete.totalAmount)}</li>
                      <li>Monto pagado: {formatAmount(debtToDelete.paidAmount)}</li>
                      <li>Historial de pagos</li>
                      <li>Información de vencimiento</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de celebración */}
      {showCelebration && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm">
            <p className="text-center font-semibold text-xs">{celebrationMessage}</p>
          </div>
        </div>
      )}

      {/* Toast de recordatorio */}
      {showReminder && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl max-w-sm">
            <p className="font-semibold text-xs">{reminderMessage}</p>
          </div>
        </div>
      )}

      {/* Modal de registro de pago */}
      {showPaymentModal && debtToPay && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign size={32} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Registrar Pago</h3>
                <p className="text-xs text-gray-600">Deuda: {debtToPay.name}</p>
              </div>
            </div>

            {/* Información actual */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total</p>
                  <p className="font-bold text-gray-900">{formatAmount(debtToPay.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Pagado</p>
                  <p className="font-bold text-green-600">{formatAmount(debtToPay.paidAmount)}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Restante</p>
                <p className="font-bold text-orange-600">{formatAmount(debtToPay.totalAmount - debtToPay.paidAmount)}</p>
              </div>
            </div>

            {/* Input de pago */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Monto del pago *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-400">{currency.symbol}</span>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-green-500 focus:outline-none modal-input text-2xl font-bold"
                  autoFocus
                  min="0"
                  step="0.01"
                  max={debtToPay.totalAmount - debtToPay.paidAmount}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Máximo: {formatAmount(debtToPay.totalAmount - debtToPay.paidAmount)}
              </p>
            </div>

            {/* Comprobante de pago */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">
                  Comprobante (opcional)
                </label>
                
                {!paymentReceipt ? (
                  <button
                    onClick={handleReceiptClick}
                    className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-all border border-dashed border-gray-300 whitespace-nowrap"
                  >
                    <Camera size={14} className="text-gray-500" />
                    <span>Agregar</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-200">
                      <img 
                        src={paymentReceipt} 
                        alt="Comprobante" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={handleRemoveReceipt}
                      className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <X size={12} className="text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setDebtToPay(null);
                  setPaymentAmount('');
                  setPaymentReceipt(null);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${
                  paymentAmount && parseFloat(paymentAmount) > 0
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Registrar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de historial de pagos */}
      {showHistoryModal && debtHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[85vh] shadow-2xl animate-scale-in flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <History size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Historial de Pagos</h3>
                <p className="text-gray-600">{debtHistory.name}</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {debtHistory.paymentHistory && debtHistory.paymentHistory.length > 0 ? (
                <div className="space-y-3">
                  {/* Resumen */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Resumen</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-600">Total Pagado</p>
                        <p className="font-semibold text-gray-900">{formatAmount(debtHistory.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total de Pagos</p>
                        <p className="font-semibold text-gray-900">{debtHistory.paymentHistory.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {debtHistory.paymentHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((payment) => (
                      <div key={payment.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{formatAmount(payment.amount)}</p>
                            <div className="text-xs text-gray-500">
                              <p>Pago registrado el:</p>
                              <p>
                                {new Date(payment.date).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}, {new Date(payment.date).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditPayment(payment)}
                              className="p-2 text-blue-500 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
                              title="Editar monto"
                            >
                              <Pencil size={16} />
                            </button>
                            {payment.receipt && (
                              <button
                                onClick={() => handleShowReceipt(payment.receipt!)}
                                className="p-2 text-green-500 hover:text-green-600 transition-colors rounded-xl hover:bg-green-50"
                                title="Ver comprobante"
                              >
                                <Image size={16} />
                              </button>
                            )}
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle size={16} className="text-green-600" />
                            </div>
                          </div>
                        </div>
                        {payment.receipt && (
                          <div className="mt-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                              <img 
                                src={payment.receipt} 
                                alt="Comprobante" 
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleShowReceipt(payment.receipt!)}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Toca para ver comprobante</p>
                          </div>
                        )}
                        
                        {/* Botón eliminar en esquina inferior derecha */}
                        <button
                          onClick={() => handleDeletePayment(payment)}
                          className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                          title="Eliminar pago"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <History size={32} className="text-gray-400" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Sin pagos registrados</h4>
                  <p className="text-gray-600">Esta deuda aún no tiene pagos registrados.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-6 flex-shrink-0">
              <button
                onClick={handleCloseHistory}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de opciones de comprobante */}
      {showReceiptOptions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-gray-900">Agregar Comprobante</h3>
              <button
                onClick={handleCloseReceiptOptions}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Opciones */}
            <div className="space-y-4">
              <button
                onClick={handleTakePhoto}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-all border-2 border-blue-200"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Camera size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Tomar Foto</p>
                  <p className="text-xs text-blue-500">Capturar con la cámara</p>
                </div>
              </button>

              <button
                onClick={handleSelectFromGallery}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-purple-50 text-purple-600 font-medium hover:bg-purple-100 transition-all border-2 border-purple-200"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Image size={24} />
                </div>
                <div className="text-left">
                  <p className="font-semibold">Seleccionar de Galería</p>
                  <p className="text-xs text-purple-500">Elegir imagen existente</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar comprobante en tamaño completo */}
      {showReceiptModal && receiptImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] shadow-2xl animate-scale-in flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-900">Comprobante de Pago</h3>
              <button
                onClick={handleCloseReceipt}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Imagen */}
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden">
              <img 
                src={receiptImage} 
                alt="Comprobante de pago" 
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-3 pt-4 flex-shrink-0">
              <button
                onClick={handleCloseReceipt}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar monto de pago */}
      {showEditPaymentModal && paymentToEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Pencil size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Editar Pago</h3>
                <p className="text-gray-600">Modificar el monto del pago</p>
              </div>
            </div>

            {/* Información del pago actual */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">Monto actual:</span>
                <span className="font-semibold text-gray-900">{formatAmount(paymentToEdit.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Fecha:</span>
                <span className="text-xs text-gray-700">
                  {new Date(paymentToEdit.date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Nuevo monto */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-3">
                Nuevo monto *
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-400">{currency.symbol}</span>
                <input
                  type="number"
                  value={editPaymentAmount}
                  onChange={(e) => setEditPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none modal-input text-2xl font-bold"
                  autoFocus
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseEditPayment}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditPayment}
                disabled={!editPaymentAmount || parseFloat(editPaymentAmount) <= 0}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${
                  editPaymentAmount && parseFloat(editPaymentAmount) > 0
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar pago */}
      {showDeletePaymentModal && paymentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Eliminar Pago</h3>
                <p className="text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Información del pago a eliminar */}
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3">¿Estás seguro de eliminar este pago?</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Monto:</span>
                  <span className="font-semibold text-red-900">{formatAmount(paymentToDelete.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Fecha:</span>
                  <span className="text-xs text-red-800">
                    {new Date(paymentToDelete.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {paymentToDelete.receipt && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-red-700">Comprobante:</span>
                    <span className="text-xs text-red-800">También se eliminará</span>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseDeletePayment}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeletePayment}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Eliminar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
