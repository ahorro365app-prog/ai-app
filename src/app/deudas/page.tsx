"use client";

import { useState, useEffect } from 'react';
import { Plus, CreditCard, Calendar, DollarSign, Trash2, Edit2, CheckCircle } from 'lucide-react';

interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  interestRate?: number;
  description?: string;
  creditor: string;
  createdAt: string;
}

export default function DeudasPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  
  // Estados para el formulario
  const [debtName, setDebtName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [description, setDescription] = useState('');
  const [creditor, setCreditor] = useState('');

  // Cargar deudas guardadas
  useEffect(() => {
    const savedDebts = localStorage.getItem('userDebts');
    if (savedDebts) {
      setDebts(JSON.parse(savedDebts));
    }
  }, []);

  // Guardar deudas
  const saveDebts = (newDebts: Debt[]) => {
    setDebts(newDebts);
    localStorage.setItem('userDebts', JSON.stringify(newDebts));
  };

  // Calcular días restantes
  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Agregar nueva deuda
  const handleAddDebt = () => {
    if (debtName && totalAmount && dueDate && creditor) {
      const newDebt: Debt = {
        id: Date.now().toString(),
        name: debtName,
        totalAmount: parseFloat(totalAmount),
        paidAmount: parseFloat(paidAmount) || 0,
        dueDate,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        description,
        creditor,
        createdAt: new Date().toISOString(),
      };

      const newDebts = [...debts, newDebt];
      saveDebts(newDebts);
      
      // Limpiar formulario
      setDebtName('');
      setTotalAmount('');
      setPaidAmount('');
      setDueDate('');
      setInterestRate('');
      setDescription('');
      setCreditor('');
      setShowAddDebtModal(false);
    }
  };

  // Eliminar deuda
  const handleDeleteDebt = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta deuda?')) {
      const newDebts = debts.filter(debt => debt.id !== id);
      saveDebts(newDebts);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Mis Deudas</h1>
        <p className="text-gray-600">Gestiona tus préstamos y pagos pendientes</p>
      </div>

      {/* Resumen principal */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-red-100 text-sm mb-1">Total de deudas</p>
            <p className="text-4xl font-bold">${totalDebt.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-red-100 text-sm mb-1">Restante</p>
            <p className="text-2xl font-bold">${remainingDebt.toFixed(2)}</p>
          </div>
        </div>
        
        {/* Barra de progreso general */}
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
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
        
        <p className="text-red-100 text-sm">
          {debts.length} {debts.length === 1 ? 'deuda' : 'deudas'} registrada{debts.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Lista de deudas */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <CreditCard size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tienes deudas registradas</h3>
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
          {debts.map((debt) => {
            const remaining = debt.totalAmount - debt.paidAmount;
            const daysRemaining = getDaysRemaining(debt.dueDate);
            const progress = (debt.paidAmount / debt.totalAmount) * 100;

            return (
              <div key={debt.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg">{debt.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">Acreedor: {debt.creditor}</span>
                    </div>
                    {debt.description && (
                      <p className="text-sm text-gray-500">{debt.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteDebt(debt.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Barra de progreso */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Información financiera */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Total</p>
                    <p className="font-bold text-red-600 text-lg">${debt.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Pagado</p>
                    <p className="font-bold text-green-600 text-lg">${debt.paidAmount.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Restante</p>
                    <p className="font-bold text-orange-600 text-lg">${remaining.toFixed(2)}</p>
                  </div>
                </div>

                {/* Fecha de vencimiento */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Vence: {new Date(debt.dueDate).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    daysRemaining < 0 
                      ? 'bg-red-100 text-red-600' 
                      : daysRemaining < 7 
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
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <CreditCard size={32} className="text-red-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Nueva Deuda
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la deuda *
                </label>
                <input
                  type="text"
                  value={debtName}
                  onChange={(e) => setDebtName(e.target.value)}
                  placeholder="Préstamo personal, tarjeta de crédito..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Acreedor *
                </label>
                <input
                  type="text"
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  placeholder="Banco, persona, institución..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Monto total *
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ya pagado
                  </label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fecha de vencimiento *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tasa de interés (% anual)
                </label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
            </div>

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
      )}
    </div>
  );
}
