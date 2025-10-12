"use client";

import { useState, useEffect } from 'react';
import { Plus, Target, Calendar, DollarSign, Trash2, Gift, Star } from 'lucide-react';

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
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  
  // Estados para el formulario
  const [goalName, setGoalName] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState<Goal['category']>('otro');
  const [priority, setPriority] = useState<Goal['priority']>('media');

  // Cargar metas guardadas
  useEffect(() => {
    const savedGoals = localStorage.getItem('userGoals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Guardar metas
  const saveGoals = (newGoals: Goal[]) => {
    setGoals(newGoals);
    localStorage.setItem('userGoals', JSON.stringify(newGoals));
  };

  // Calcular días restantes
  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Agregar nueva meta
  const handleAddGoal = () => {
    if (goalName && targetAmount && targetDate) {
      const newGoal: Goal = {
        id: Date.now().toString(),
        name: goalName,
        description,
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate,
        category,
        priority,
        createdAt: new Date().toISOString(),
      };

      const newGoals = [...goals, newGoal];
      saveGoals(newGoals);
      
      // Limpiar formulario
      setGoalName('');
      setDescription('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setCategory('otro');
      setPriority('media');
      setShowAddGoalModal(false);
    }
  };

  // Eliminar meta
  const handleDeleteGoal = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta meta?')) {
      const newGoals = goals.filter(goal => goal.id !== id);
      saveGoals(newGoals);
    }
  };

  // Calcular totales
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Mis Metas</h1>
        <p className="text-gray-600">Ahorra para tus sueños y recompensas</p>
      </div>

      {/* Resumen principal */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-purple-100 text-sm mb-1">Total de metas</p>
            <p className="text-4xl font-bold">${totalTarget.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm mb-1">Ahorrado</p>
            <p className="text-2xl font-bold">${totalCurrent.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Barra de progreso general */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-purple-100">Progreso general</span>
            <span className="font-medium">{totalProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-purple-300/30 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${Math.min(totalProgress, 100)}%` }}
            />
          </div>
        </div>
        
        <p className="text-purple-100 text-sm">
          {goals.length} {goals.length === 1 ? 'meta' : 'metas'} activa{goals.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Lista de metas */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <Gift size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes metas establecidas</h3>
          <p className="text-gray-600 mb-6">Crea tu primera meta de ahorro para alcanzar tus sueños</p>
          <button
            onClick={() => setShowAddGoalModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-all"
          >
            Crear Primera Meta
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const daysRemaining = getDaysRemaining(goal.targetDate);
            const remaining = goal.targetAmount - goal.currentAmount;
            const categoryInfo = GOAL_CATEGORIES[goal.category];

            return (
              <div key={goal.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-4xl">{categoryInfo.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-2 text-lg">{goal.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Target size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-600">{categoryInfo.label}</span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-500">{goal.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Información financiera */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Meta</p>
                    <p className="font-bold text-purple-600 text-lg">${goal.targetAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Ahorrado</p>
                    <p className="font-bold text-green-600 text-lg">${goal.currentAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Falta</p>
                    <p className="font-bold text-orange-600 text-lg">${remaining.toFixed(2)}</p>
                  </div>
                </div>

                {/* Fecha objetivo */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Objetivo: {new Date(goal.targetDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    daysRemaining < 0 
                      ? 'bg-red-100 text-red-600' 
                      : daysRemaining < 30 
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {daysRemaining < 0 ? 'Vencido' : `${daysRemaining} días`}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Botón flotante para agregar */}
          <button
            onClick={() => setShowAddGoalModal(true)}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Categoría
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(GOAL_CATEGORIES).map(([key, info]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key as Goal['category'])}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                        category === key
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{info.emoji}</span>
                      <span className="text-xs font-medium">{info.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha objetivo *
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:outline-none modal-input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prioridad
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('baja')}
                    className={`py-2 px-3 rounded-xl border-2 transition-all ${
                      priority === 'baja'
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-200 hover:border-green-300'
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
                        : 'border-gray-200 hover:border-yellow-300'
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
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    🔥 Alta
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                  onClick={() => setShowAddGoalModal(false)}
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
    </div>
  );
}
