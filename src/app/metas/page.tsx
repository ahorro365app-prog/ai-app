"use client";

import { useState, useEffect } from 'react';
import { Plus, Target, Calendar, DollarSign, Trash2, Gift, Star, History, Camera, Image, X, Pencil, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';

interface SavingsRecord {
  id: string;
  amount: number;
  date: string;
  description?: string;
  receipt?: string; // Base64 de la imagen del comprobante
}

interface Goal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'celular' | 'auto' | 'viaje' | 'casa' | 'educacion' | 'otro';
  priority: 'baja' | 'media' | 'alta';
  createdAt: string;
  savingsHistory: SavingsRecord[];
}

const GOAL_CATEGORIES = {
  celular: { emoji: '📱', label: 'Celular' },
  auto: { emoji: '🚗', label: 'Auto' },
  viaje: { emoji: '✈️', label: 'Viaje' },
  casa: { emoji: '🏠', label: 'Casa' },
  educacion: { emoji: '🎓', label: 'Educación' },
  otro: { emoji: '🎯', label: 'Otro' },
};

export default function MetasPage() {
  const { formatAmount, currency } = useCurrency();
  const { user, goals: supabaseGoals, addGoal: addSupabaseGoal, updateGoal: updateSupabaseGoal, deleteGoal: deleteSupabaseGoal } = useSupabase();
  const { setModalOpen } = useModal();
  const [goals, setGoals] = useState<Goal[]>([]);
  // Usar moneda de Supabase si está disponible
  const currentCurrency = user?.moneda || currency;
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  
  // Estados para celebraciones y recordatorios
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  
  // Estados para ahorros
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [goalToSave, setGoalToSave] = useState<Goal | null>(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [goalHistory, setGoalHistory] = useState<Goal | null>(null);
  const [celebratedMilestones, setCelebratedMilestones] = useState<Record<string, Set<number>>>({});
  
  // Estados para comprobantes
  const [savingsReceipt, setSavingsReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  
  // Estados para editar ahorros
  const [showEditSavingsModal, setShowEditSavingsModal] = useState(false);
  const [showDeleteSavingsModal, setShowDeleteSavingsModal] = useState(false);
  const [savingsToEdit, setSavingsToEdit] = useState<SavingsRecord | null>(null);
  const [savingsToDelete, setSavingsToDelete] = useState<SavingsRecord | null>(null);
  const [editSavingsAmount, setEditSavingsAmount] = useState('');
  
  // Estados para el formulario
  const [goalName, setGoalName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [hasTargetDate, setHasTargetDate] = useState(false);
  const [category, setCategory] = useState<Goal['category']>('otro');
  const [priority, setPriority] = useState<Goal['priority']>('media');

  // Cargar metas desde Supabase o localStorage
  useEffect(() => {
    if (user && supabaseGoals.length > 0) {
      // Convertir datos de Supabase al formato local
      const convertedGoals = supabaseGoals.map(goal => ({
        id: goal.id,
        name: goal.nombre,
        description: goal.descripcion || '',
        targetAmount: goal.monto_objetivo,
        currentAmount: goal.monto_actual,
        targetDate: goal.fecha_objetivo || '',
        category: (goal.categoria in GOAL_CATEGORIES ? goal.categoria : 'otro') as 'celular' | 'auto' | 'viaje' | 'casa' | 'educacion' | 'otro',
        priority: goal.prioridad as 'baja' | 'media' | 'alta',
        createdAt: new Date().toISOString(),
        savingsHistory: goal.historial_ahorros || []
      }));
      setGoals(convertedGoals);
    }
  }, [user, supabaseGoals]);

  // Cargar celebraciones ya realizadas
  useEffect(() => {
    // No cargar celebraciones de localStorage - usar estado por defecto
    setCelebratedMilestones({});
  }, []);

  // Verificar recordatorios al cargar
  useEffect(() => {
    if (goals.length > 0) {
      checkDateReminders();
    }
  }, [goals]);

  // Guardar metas
  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    // No guardar en localStorage - solo en Supabase
  };

  // Calcular días restantes
  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Manejar toggle de fecha objetivo
  const handleTargetDateToggle = (hasDate: boolean) => {
    setHasTargetDate(hasDate);
    
    if (!hasDate) {
      // Si se desactiva, limpiar la fecha
      setTargetDate('');
    }
  };

  // Agregar nueva meta
  const handleAddGoal = async () => {
    if (goalName && targetAmount) {
      const newGoal = {
        nombre: goalName,
        descripcion: description,
        monto_objetivo: parseFloat(targetAmount),
        monto_actual: parseFloat(currentAmount) || 0,
        fecha_objetivo: targetDate,
        categoria: category,
        prioridad: priority,
        historial_ahorros: [], // Historial vacío inicialmente
      };

      if (user) {
        // Usar Supabase si hay usuario
        await addSupabaseGoal(newGoal);
      } else {
        // Fallback a localStorage
        const localGoal: Goal = {
          id: Date.now().toString(),
          name: goalName,
          description,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate,
          category,
          priority,
          createdAt: new Date().toISOString(),
          savingsHistory: [],
        };
        const newGoals = [...goals, localGoal];
        saveGoals(newGoals);
      }
      
      // Limpiar formulario
      setGoalName('');
      setDescription('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setCategory('otro');
      setPriority('media');
      setShowAddGoalModal(false);
      setModalOpen(false);
    }
  };

  // Abrir modal de confirmación para eliminar meta
  const handleDeleteGoal = (goal: Goal) => {
    setGoalToDelete(goal);
    setShowDeleteConfirmModal(true);
    setModalOpen(true);
  };

  // Confirmar eliminación de meta
  const handleConfirmDeleteGoal = async () => {
    if (goalToDelete) {
      if (user) {
        // Usar Supabase si hay usuario
        await deleteSupabaseGoal(goalToDelete.id);
      } else {
        // Fallback a localStorage
        const newGoals = goals.filter(goal => goal.id !== goalToDelete.id);
        saveGoals(newGoals);
      }
      setShowDeleteConfirmModal(false);
      setModalOpen(false);
      setGoalToDelete(null);
    }
  };

  // Cancelar eliminación de meta
  const handleCancelDeleteGoal = () => {
    setShowDeleteConfirmModal(false);
    setModalOpen(false);
    setGoalToDelete(null);
  };

  // Funciones de toast
  const showCelebrationToast = (message: string) => {
    setCelebrationMessage(message);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      setCelebrationMessage('');
    }, 5000);
  };

  const showReminderToast = (message: string) => {
    setReminderMessage(message);
    setShowReminder(true);
    setTimeout(() => {
      setShowReminder(false);
      setReminderMessage('');
    }, 5000);
  };

  // Verificar celebraciones por progreso (solo la primera vez)
  const checkProgressCelebrations = (goal: Goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    const goalId = goal.id;
    
    // Inicializar Set para esta meta si no existe
    if (!celebratedMilestones[goalId]) {
      celebratedMilestones[goalId] = new Set();
    }
    
    // Verificar cada milestone y celebrar solo si es la primera vez
    if (progress >= 100 && !celebratedMilestones[goalId].has(100)) {
      celebratedMilestones[goalId].add(100);
      showCelebrationToast(`🎉 ¡FELICITACIONES! ¡Has alcanzado tu meta "${goal.name}"! ¡Disfruta tu recompensa! 🎉`);
    } else if (progress >= 75 && !celebratedMilestones[goalId].has(75)) {
      celebratedMilestones[goalId].add(75);
      showCelebrationToast(`🎊 ¡Increíble! Has ahorrado el 75% para "${goal.name}". ¡Ya casi lo logras! 🎊`);
    } else if (progress >= 50 && !celebratedMilestones[goalId].has(50)) {
      celebratedMilestones[goalId].add(50);
      showCelebrationToast(`🎉 ¡Felicidades! Has ahorrado el 50% para "${goal.name}". ¡Vas por buen camino! 🎉`);
    } else if (progress >= 25 && !celebratedMilestones[goalId].has(25)) {
      celebratedMilestones[goalId].add(25);
      showCelebrationToast(`🎈 ¡Bien hecho! Has ahorrado el 25% para "${goal.name}". ¡Sigue así! 🎈`);
    }
    
    // Guardar celebraciones en localStorage
    const celebrationsToSave: Record<string, number[]> = {};
    Object.keys(celebratedMilestones).forEach(key => {
      celebrationsToSave[key] = Array.from(celebratedMilestones[key]);
    });
    // No guardar celebraciones en localStorage - usar estado local
  };

  // Verificar recordatorios de fecha límite
  const checkDateReminders = () => {
    goals.forEach(goal => {
      const daysRemaining = getDaysRemaining(goal.targetDate);
      if (daysRemaining <= 0) {
        showReminderToast(`⚠️ Tu meta "${goal.name}" ya venció. ¡Es hora de revisarla! ⚠️`);
      } else if (daysRemaining <= 7) {
        showReminderToast(`📅 Recordatorio: Tu meta "${goal.name}" vence en ${daysRemaining} días. 📅`);
      }
    });
  };

  // Abrir modal de ahorro
  const handleSavingsClick = (goal: Goal) => {
    setGoalToSave(goal);
    setSavingsAmount('');
    setSavingsReceipt(null);
    setShowSavingsModal(true);
    setModalOpen(true);
  };

  // Abrir modal de historial
  const handleShowHistory = (goal: Goal) => {
    setGoalHistory(goal);
    setShowHistoryModal(true);
    setModalOpen(true);
  };

  // Cerrar modal de historial
  const handleCloseHistory = () => {
    setShowHistoryModal(false);
    setModalOpen(false);
    setGoalHistory(null);
  };

  // Funciones para comprobantes
  const handleReceiptClick = () => {
    setShowReceiptOptions(true);
    setModalOpen(true);
  };

  const handleCloseReceiptOptions = () => {
    setShowReceiptOptions(false);
    setModalOpen(false);
  };

  const handleSelectFromGallery = () => {
    setShowReceiptOptions(false);
    setModalOpen(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSavingsReceipt(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleTakePhoto = () => {
    setShowReceiptOptions(false);
    setModalOpen(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSavingsReceipt(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleRemoveReceipt = () => {
    setSavingsReceipt(null);
  };

  const handleShowReceipt = (image: string) => {
    setReceiptImage(image);
    setShowReceiptModal(true);
    setModalOpen(true);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setModalOpen(false);
    setReceiptImage(null);
  };

  // Registrar ahorro
  const handleRegisterSavings = async () => {
    if (goalToSave && savingsAmount) {
      const savingsValue = parseFloat(savingsAmount);
      const newCurrentAmount = goalToSave.currentAmount + savingsValue;
      
      // Crear registro del ahorro
      const savingsRecord: SavingsRecord = {
        id: Date.now().toString(),
        amount: savingsValue,
        date: new Date().toISOString(),
        description: `Ahorro registrado el ${new Date().toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}, ${new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        receipt: savingsReceipt || undefined
      };
      
      if (user) {
        // Usar Supabase si hay usuario
        const updatedHistorial = [...(goalToSave.savingsHistory || []), savingsRecord];
        await updateSupabaseGoal(goalToSave.id, {
          monto_actual: Math.min(newCurrentAmount, goalToSave.targetAmount),
          historial_ahorros: updatedHistorial
        });
      } else {
        // Fallback a localStorage
        const updatedGoals = goals.map(goal =>
          goal.id === goalToSave.id
            ? {
                ...goal,
                currentAmount: Math.min(newCurrentAmount, goal.targetAmount),
                savingsHistory: [...(goal.savingsHistory || []), savingsRecord]
              }
            : goal
        );
        saveGoals(updatedGoals);
      }
      
      // Verificar celebraciones
      const updatedGoal = {
        ...goalToSave,
        currentAmount: Math.min(newCurrentAmount, goalToSave.targetAmount)
      };
      checkProgressCelebrations(updatedGoal);
      
      // Cerrar modal y limpiar estados
      setShowSavingsModal(false);
      setModalOpen(false);
      setGoalToSave(null);
      setSavingsAmount('');
      setSavingsReceipt(null);
    }
  };

  // Funciones para editar ahorros
  const handleEditSavings = (savings: SavingsRecord) => {
    setSavingsToEdit(savings);
    setEditSavingsAmount(savings.amount.toString());
    setShowEditSavingsModal(true);
    setModalOpen(true);
  };

  const handleCloseEditSavings = () => {
    setShowEditSavingsModal(false);
    setModalOpen(false);
    setSavingsToEdit(null);
    setEditSavingsAmount('');
  };

  const handleSaveEditSavings = async () => {
    if (savingsToEdit && editSavingsAmount && goalHistory) {
      const newAmount = parseFloat(editSavingsAmount);
      const oldAmount = savingsToEdit.amount;
      const difference = newAmount - oldAmount;

      // Actualizar el historial de ahorros
      const updatedSavingsHistory = goalHistory.savingsHistory.map(savings =>
        savings.id === savingsToEdit.id
          ? { ...savings, amount: newAmount }
          : savings
      );

      // Actualizar el monto total ahorrado
      const newTotalSaved = Math.max(0, goalHistory.currentAmount + difference);

      if (user) {
        // Usar Supabase si hay usuario
        await updateSupabaseGoal(goalHistory.id, {
          monto_actual: newTotalSaved,
          historial_ahorros: updatedSavingsHistory
        });
      } else {
        // Fallback a localStorage
        const updatedGoals = goals.map(goal =>
          goal.id === goalHistory.id
            ? {
                ...goal,
                currentAmount: newTotalSaved,
                savingsHistory: updatedSavingsHistory
              }
            : goal
        );
        saveGoals(updatedGoals);
      }
      
      // Actualizar el estado local del historial
      setGoalHistory({
        ...goalHistory,
        currentAmount: newTotalSaved,
        savingsHistory: updatedSavingsHistory
      });

      // Verificar celebraciones con la meta actualizada
      const updatedGoal = {
        ...goalHistory,
        currentAmount: newTotalSaved
      };
      checkProgressCelebrations(updatedGoal);

      handleCloseEditSavings();
    }
  };

  const handleDeleteSavings = (savings: SavingsRecord) => {
    setSavingsToDelete(savings);
    setShowDeleteSavingsModal(true);
    setModalOpen(true);
  };

  const handleCloseDeleteSavings = () => {
    setShowDeleteSavingsModal(false);
    setModalOpen(false);
    setSavingsToDelete(null);
  };

  const handleConfirmDeleteSavings = async () => {
    if (savingsToDelete && goalHistory) {
      const amountToSubtract = savingsToDelete.amount;

      // Eliminar el ahorro del historial
      const updatedSavingsHistory = goalHistory.savingsHistory.filter(
        savings => savings.id !== savingsToDelete.id
      );

      // Actualizar el monto total ahorrado
      const newTotalSaved = Math.max(0, goalHistory.currentAmount - amountToSubtract);

      if (user) {
        // Usar Supabase si hay usuario
        await updateSupabaseGoal(goalHistory.id, {
          monto_actual: newTotalSaved,
          historial_ahorros: updatedSavingsHistory
        });
      } else {
        // Fallback a localStorage
        const updatedGoals = goals.map(goal =>
          goal.id === goalHistory.id
            ? {
                ...goal,
                currentAmount: newTotalSaved,
                savingsHistory: updatedSavingsHistory
              }
            : goal
        );
        saveGoals(updatedGoals);
      }
      
      // Actualizar el estado local del historial
      setGoalHistory({
        ...goalHistory,
        currentAmount: newTotalSaved,
        savingsHistory: updatedSavingsHistory
      });

      // Verificar celebraciones con la meta actualizada
      const updatedGoal = {
        ...goalHistory,
        currentAmount: newTotalSaved
      };
      checkProgressCelebrations(updatedGoal);

      handleCloseDeleteSavings();
    }
  };

  // Calcular totales
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="pt-[40px] px-4 pb-24">
      {/* Header */}
      <div className="mb-6" style={{ marginTop: 0 }}>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Mis Metas</h1>
        <p className="text-gray-600">Ahorra para tus sueños y recompensas</p>
      </div>

      {/* Resumen principal */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm mb-1">Total de metas</p>
            <p className="text-base font-bold">{formatAmount(totalTarget)}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm mb-1">Ahorrado</p>
            <p className="text-base font-bold">{formatAmount(totalCurrent)}</p>
          </div>
        </div>
        
        {/* Barra de progreso general */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-6">
            <span className="text-purple-100">Progreso general</span>
            <span className="font-medium text-purple-100">{totalProgress.toFixed(1)}%</span>
          </div>
          <div className="relative w-full bg-purple-300/30 rounded-full h-2">
            {/* Marcadores de porcentajes */}
            <div className="absolute inset-0 flex justify-between items-center">
              <div className="w-px h-3 bg-purple-200/50"></div>
              <div className="w-px h-3 bg-purple-200/50"></div>
              <div className="w-px h-3 bg-purple-200/50"></div>
              <div className="w-px h-3 bg-purple-200/50"></div>
              <div className="w-px h-3 bg-purple-200/50"></div>
            </div>
            {/* Etiquetas de porcentajes */}
            <div className="absolute -top-5 w-full flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
            {/* Barra de progreso */}
            <div 
              className="bg-white h-2 rounded-full transition-all relative z-10"
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
        </div>
        
        <p className="text-purple-100 text-xs">
          {goals.length} {goals.length === 1 ? 'meta' : 'metas'} activa{goals.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Lista de metas */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <Gift size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-gray-900 mb-2">No tienes metas establecidas</h3>
          <p className="text-gray-600 mb-6">Crea tu primera meta de ahorro para alcanzar tus sueños</p>
          <button
            onClick={() => {
              setShowAddGoalModal(true);
              setModalOpen(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Crear Primera Meta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.filter(goal => goal && goal.id).map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const remaining = goal.targetAmount - goal.currentAmount;
            const categoryInfo = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.otro;

            return (
              <div key={goal.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{categoryInfo.emoji}</span>
                    <h3 className="font-bold text-gray-900 text-sm">{goal.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      goal.priority === 'alta' 
                        ? 'bg-red-100 text-red-600' 
                        : goal.priority === 'media'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {goal.priority === 'alta' ? '🔥' : goal.priority === 'media' ? '⭐' : '💤'}
                    </span>
                    <button
                      onClick={() => handleSavingsClick(goal)}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors rounded-xl hover:bg-green-50"
                      title="Registrar ahorro"
                    >
                      <DollarSign size={18} />
                    </button>
                    <button
                      onClick={() => handleShowHistory(goal)}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors rounded-xl hover:bg-blue-50"
                      title="Ver historial de ahorros"
                    >
                      <History size={18} />
                    </button>
                  </div>
                </div>

                {/* Información de categoría y descripción */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-600">{categoryInfo.label}</span>
                  </div>
                  {goal.description && (
                    <p className="text-xs text-gray-500">{goal.description}</p>
                  )}
                </div>

                {/* Barra de progreso */}
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
                  <div className="relative w-full bg-gray-200 rounded-full h-2">
                    {/* Marcadores de porcentajes */}
                    <div className="absolute inset-0 flex justify-between items-center">
                      <div className="w-px h-3 bg-gray-300"></div>
                      <div className="w-px h-3 bg-gray-300"></div>
                      <div className="w-px h-3 bg-gray-300"></div>
                      <div className="w-px h-3 bg-gray-300"></div>
                      <div className="w-px h-3 bg-gray-300"></div>
                    </div>
                    {/* Etiquetas de porcentajes */}
                    <div className="absolute -top-7 w-full flex justify-between text-xs text-gray-400">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                    {/* Barra de progreso */}
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all relative z-10"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Información financiera */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Meta</p>
                    <p className="font-bold text-purple-600 text-xs">{formatAmount(goal.targetAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Ahorrado</p>
                    <p className="font-bold text-green-600 text-xs">{formatAmount(goal.currentAmount)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Falta</p>
                    <p className="font-bold text-orange-600 text-xs">{formatAmount(remaining)}</p>
                  </div>
                </div>

                {/* Fecha objetivo */}
                <div className="relative mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Objetivo: {new Date(goal.targetDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-start">
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        daysRemaining < 0 
                          ? 'bg-red-100 text-red-600' 
                          : daysRemaining < 30 
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {daysRemaining < 0 ? 'Vencido' : `Faltan ${daysRemaining} días`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botón eliminar en esquina inferior derecha */}
                  <button
                    onClick={() => handleDeleteGoal(goal)}
                    className="absolute bottom-0 right-0 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    title="Eliminar meta"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Botón flotante para agregar */}
          <button
            onClick={() => {
              setShowAddGoalModal(true);
              setModalOpen(true);
            }}
            className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Modal para agregar meta */}
      {showAddGoalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header fijo */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
                <Target size={32} className="text-purple-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Nueva Meta
              </h3>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Nombre de la meta *
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="iPhone 15, viaje a Europa..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none modal-input"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
                    {Object.entries(GOAL_CATEGORIES).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCategory(key as Goal['category'])}
                        className={`
                          flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-w-[80px] snap-center
                          ${category === key
                            ? 'border-purple-500 bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg text-white'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                          }
                        `}
                      >
                        <span className="text-lg mb-1">{info.emoji}</span>
                        <span className={`text-xs font-bold text-center ${category === key ? 'text-white' : 'text-gray-700'}`}>
                          {info.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Meta total *
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none modal-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Ya ahorrado
                  </label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none modal-input"
                  />
                </div>
              </div>

              {/* Toggle de fecha objetivo */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Calendar size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Fecha objetivo</p>
                    <p className="text-xs text-gray-600">¿Tienes una fecha límite para esta meta?</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTargetDateToggle(!hasTargetDate)}
                  className={`
                    relative w-12 h-6 rounded-full transition-all duration-200 ease-in-out
                    ${hasTargetDate 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                      : 'bg-gray-300'
                    }
                  `}
                >
                  <div
                    className={`
                      absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-all duration-200 ease-in-out shadow-md
                      ${hasTargetDate ? 'transform translate-x-6' : ''}
                    `}
                  />
                </button>
              </div>

              {/* Campo de fecha objetivo - solo visible si está activado */}
              {hasTargetDate && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Fecha objetivo</p>
                      <p className="text-xs text-gray-600">Selecciona cuándo quieres alcanzar tu meta</p>
                    </div>
                  </div>
                  
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none modal-input"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Prioridad
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('baja')}
                    className={`py-2 px-3 rounded-xl border-2 transition-all ${
                      priority === 'baja'
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-200 hover:border-green-300 text-gray-700'
                    }`}
                  >
                    💤 Baja
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('media')}
                    className={`py-2 px-3 rounded-xl border-2 transition-all ${
                      priority === 'media'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-600'
                        : 'border-gray-200 hover:border-yellow-300 text-gray-700'
                    }`}
                  >
                    ⭐ Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('alta')}
                    className={`py-2 px-3 rounded-xl border-2 transition-all ${
                      priority === 'alta'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-200 hover:border-red-300 text-gray-700'
                    }`}
                  >
                    🔥 Alta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="¿Por qué es importante esta meta?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none resize-none modal-input"
                />
              </div>
            </div>
            </div>

            {/* Footer fijo */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddGoalModal(false);
                    setModalOpen(false);
                  }}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddGoal}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
                >
                  Crear Meta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts de celebración y recordatorios */}
      {showCelebration && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
            <p className="font-medium">{celebrationMessage}</p>
          </div>
        </div>
      )}

      {showReminder && (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-xl shadow-lg">
            <p className="font-medium">{reminderMessage}</p>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar meta */}
      {showDeleteConfirmModal && goalToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Eliminar Meta</h3>
                <p className="text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Información de la meta */}
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3">¿Estás seguro de eliminar esta meta?</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Meta:</span>
                  <span className="font-semibold text-red-900">{goalToDelete.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Monto objetivo:</span>
                  <span className="font-semibold text-red-900">{formatAmount(goalToDelete.targetAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Ahorrado:</span>
                  <span className="font-semibold text-red-900">{formatAmount(goalToDelete.currentAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Historial de ahorros:</span>
                  <span className="text-xs text-red-800">También se eliminará</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDeleteGoal}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteGoal}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Eliminar Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para registrar ahorro */}
      {showSavingsModal && goalToSave && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign size={32} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Registrar Ahorro</h3>
                <p className="text-gray-600">{goalToSave.name}</p>
              </div>
            </div>

            {/* Información de la meta */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex-shrink-0">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-600">Meta:</p>
                  <p className="font-semibold text-gray-900">{formatAmount(goalToSave.targetAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ahorrado:</p>
                  <p className="font-semibold text-green-600">{formatAmount(goalToSave.currentAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Falta:</p>
                  <p className="font-semibold text-orange-600">{formatAmount(goalToSave.targetAmount - goalToSave.currentAmount)}</p>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {/* Monto del ahorro */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-700 mb-3">
                  Monto del ahorro *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-400">{currency.symbol}</span>
                  <input
                    type="number"
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-green-500 focus:outline-none modal-input text-2xl font-bold"
                    autoFocus
                    min="0"
                    step="0.01"
                    max={goalToSave.targetAmount - goalToSave.currentAmount}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Máximo: {formatAmount(goalToSave.targetAmount - goalToSave.currentAmount)}
                </p>
              </div>

              {/* Comprobante de ahorro */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-gray-700">
                    Comprobante (opcional)
                  </label>
                  
                  {!savingsReceipt ? (
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
                          src={savingsReceipt} 
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
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-6 flex-shrink-0">
              <button
                onClick={() => {
                  setShowSavingsModal(false);
                  setModalOpen(false);
                  setGoalToSave(null);
                  setSavingsAmount('');
                  setSavingsReceipt(null);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterSavings}
                disabled={!savingsAmount || parseFloat(savingsAmount) <= 0}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${
                  savingsAmount && parseFloat(savingsAmount) > 0
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Registrar Ahorro
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
              <h3 className="text-xs font-bold text-gray-900">Agregar Comprobante</h3>
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
              <h3 className="text-xs font-bold text-gray-900">Comprobante de Ahorro</h3>
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
                alt="Comprobante de ahorro" 
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

      {/* Modal de historial de ahorros */}
      {showHistoryModal && goalHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[85vh] shadow-2xl animate-scale-in flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <History size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Historial de Ahorros</h3>
                <p className="text-gray-600">{goalHistory.name}</p>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              {goalHistory.savingsHistory && goalHistory.savingsHistory.length > 0 ? (
                <div className="space-y-3">
                  {/* Resumen */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-semibold text-gray-900 mb-2">Resumen</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-gray-600">Total Ahorrado</p>
                        <p className="font-semibold text-gray-900">{formatAmount(goalHistory.currentAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total de Ahorros</p>
                        <p className="font-semibold text-gray-900">{goalHistory.savingsHistory.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {goalHistory.savingsHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((savings) => (
                      <div key={savings.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{formatAmount(savings.amount)}</p>
                            <div className="text-xs text-gray-500">
                              <p>Ahorro registrado el:</p>
                              <p>
                                {new Date(savings.date).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}, {new Date(savings.date).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditSavings(savings)}
                              className="p-2 text-blue-500 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50"
                              title="Editar monto"
                            >
                              <Pencil size={16} />
                            </button>
                            {savings.receipt && (
                              <button
                                onClick={() => handleShowReceipt(savings.receipt!)}
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
                        {savings.receipt && (
                          <div className="mt-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
                              <img 
                                src={savings.receipt} 
                                alt="Comprobante" 
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => handleShowReceipt(savings.receipt!)}
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Toca para ver comprobante</p>
                          </div>
                        )}
                        
                        {/* Botón eliminar en esquina inferior derecha */}
                        <button
                          onClick={() => handleDeleteSavings(savings)}
                          className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                          title="Eliminar ahorro"
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
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Sin ahorros registrados</h4>
                  <p className="text-gray-600">Esta meta aún no tiene ahorros registrados.</p>
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

      {/* Modal para editar monto de ahorro */}
      {showEditSavingsModal && savingsToEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Pencil size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Editar Ahorro</h3>
                <p className="text-gray-600">Modificar el monto del ahorro</p>
              </div>
            </div>

            {/* Información del ahorro actual */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-600">Monto actual:</span>
                <span className="font-semibold text-gray-900">{formatAmount(savingsToEdit.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Fecha:</span>
                <span className="text-xs text-gray-700">
                  {new Date(savingsToEdit.date).toLocaleDateString('es-ES', {
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
                  value={editSavingsAmount}
                  onChange={(e) => setEditSavingsAmount(e.target.value)}
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
                onClick={handleCloseEditSavings}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditSavings}
                disabled={!editSavingsAmount || parseFloat(editSavingsAmount) <= 0}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${
                  editSavingsAmount && parseFloat(editSavingsAmount) > 0
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

      {/* Modal de confirmación para eliminar ahorro */}
      {showDeleteSavingsModal && savingsToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-900">Eliminar Ahorro</h3>
                <p className="text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>

            {/* Información del ahorro a eliminar */}
            <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3">¿Estás seguro de eliminar este ahorro?</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Monto:</span>
                  <span className="font-semibold text-red-900">{formatAmount(savingsToDelete.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-700">Fecha:</span>
                  <span className="text-xs text-red-800">
                    {new Date(savingsToDelete.date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {savingsToDelete.receipt && (
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
                onClick={handleCloseDeleteSavings}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteSavings}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Eliminar Ahorro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
