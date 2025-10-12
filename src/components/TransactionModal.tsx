"use client";

import { useState, useEffect } from "react";
import { X, TrendingDown, TrendingUp, Wallet, CreditCard, Smartphone, Banknote, MoreHorizontal, Search, Calendar } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";

type TransactionType = 'expense' | 'income';
type PaymentMethod = 'cash' | 'card' | 'transfer' | 'qr' | 'other';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
}

interface Transaction {
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  description: string;
  date: string;
}

const PAYMENT_METHODS = [
  { id: 'cash' as PaymentMethod, label: 'Efectivo', icon: Banknote, color: 'green' },
  { id: 'card' as PaymentMethod, label: 'Tarjeta', icon: CreditCard, color: 'blue' },
  { id: 'transfer' as PaymentMethod, label: 'Transferencia', icon: Smartphone, color: 'purple' },
  { id: 'qr' as PaymentMethod, label: 'QR', icon: Smartphone, color: 'indigo' },
  { id: 'other' as PaymentMethod, label: 'Otro', icon: MoreHorizontal, color: 'gray' },
];

const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Comida', emoji: '🍽️' },
  { id: 'transport', label: 'Transporte', emoji: '🚗' },
  { id: 'entertainment', label: 'Entretenimiento', emoji: '🎬' },
  { id: 'shopping', label: 'Compras', emoji: '🛍️' },
  { id: 'health', label: 'Salud', emoji: '💊' },
  { id: 'bills', label: 'Servicios', emoji: '💡' },
  { id: 'other', label: 'Otro', emoji: '📦' },
];

const INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salario', emoji: '💰' },
  { id: 'freelance', label: 'Freelance', emoji: '💼' },
  { id: 'investment', label: 'Inversión', emoji: '📈' },
  { id: 'gift', label: 'Regalo', emoji: '🎁' },
  { id: 'other', label: 'Otro', emoji: '💵' },
];

// Categorías extendidas para gastos
const ALL_EXPENSE_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurante', emoji: '🍴' },
  { id: 'groceries', label: 'Supermercado', emoji: '🛒' },
  { id: 'coffee', label: 'Café', emoji: '☕' },
  { id: 'fast-food', label: 'Comida rápida', emoji: '🍔' },
  { id: 'taxi', label: 'Taxi/Uber', emoji: '🚕' },
  { id: 'bus', label: 'Autobús', emoji: '🚌' },
  { id: 'gas', label: 'Gasolina', emoji: '⛽' },
  { id: 'parking', label: 'Estacionamiento', emoji: '🅿️' },
  { id: 'cinema', label: 'Cine', emoji: '🎥' },
  { id: 'concert', label: 'Concierto', emoji: '🎵' },
  { id: 'sports', label: 'Deportes', emoji: '⚽' },
  { id: 'games', label: 'Videojuegos', emoji: '🎮' },
  { id: 'clothes', label: 'Ropa', emoji: '👕' },
  { id: 'shoes', label: 'Calzado', emoji: '👟' },
  { id: 'electronics', label: 'Electrónica', emoji: '💻' },
  { id: 'furniture', label: 'Muebles', emoji: '🛋️' },
  { id: 'doctor', label: 'Médico', emoji: '👨‍⚕️' },
  { id: 'pharmacy', label: 'Farmacia', emoji: '💊' },
  { id: 'gym', label: 'Gimnasio', emoji: '🏋️' },
  { id: 'beauty', label: 'Belleza', emoji: '💄' },
  { id: 'electricity', label: 'Luz', emoji: '💡' },
  { id: 'water', label: 'Agua', emoji: '💧' },
  { id: 'internet', label: 'Internet', emoji: '🌐' },
  { id: 'phone', label: 'Teléfono', emoji: '📱' },
  { id: 'rent', label: 'Alquiler', emoji: '🏠' },
  { id: 'insurance', label: 'Seguro', emoji: '🛡️' },
  { id: 'education', label: 'Educación', emoji: '📚' },
  { id: 'books', label: 'Libros', emoji: '📖' },
  { id: 'gifts', label: 'Regalos', emoji: '🎁' },
  { id: 'donations', label: 'Donaciones', emoji: '❤️' },
  { id: 'pets', label: 'Mascotas', emoji: '🐾' },
  { id: 'travel', label: 'Viajes', emoji: '✈️' },
  { id: 'hotel', label: 'Hotel', emoji: '🏨' },
  { id: 'subscriptions', label: 'Suscripciones', emoji: '📺' },
];

// Función para obtener el label de una categoría por su ID
export const getCategoryLabel = (categoryId: string): string => {
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...ALL_EXPENSE_CATEGORIES];
  const category = allCategories.find(cat => cat.id === categoryId);
  return category ? category.label : categoryId;
};

// Mapeo de palabras clave a emojis sugeridos
const EMOJI_SUGGESTIONS: Record<string, string[]> = {
  // Comida
  'comida': ['🍽️', '🍴', '🍕'],
  'restaurante': ['🍽️', '🍴', '🏪'],
  'pizza': ['🍕', '🍴', '🧀'],
  'hamburguesa': ['🍔', '🍟', '🌭'],
  'cafe': ['☕', '🥤', '🍵'],
  'café': ['☕', '🥤', '🍵'],
  'desayuno': ['🥐', '🍳', '☕'],
  'almuerzo': ['🍽️', '🍴', '🥗'],
  'cena': ['🍽️', '🌙', '🍴'],
  'postre': ['🍰', '🧁', '🍩'],
  'dulce': ['🍭', '🍬', '🍫'],
  'bebida': ['🥤', '🍺', '🍷'],
  'pan': ['🥐', '🍞', '🥖'],
  
  // Transporte
  'transporte': ['🚗', '🚌', '🚕'],
  'taxi': ['🚕', '🚗', '🚖'],
  'uber': ['🚕', '🚗', '📱'],
  'bus': ['🚌', '🚎', '🚍'],
  'auto': ['🚗', '🚙', '🏎️'],
  'carro': ['🚗', '🚙', '🏎️'],
  'moto': ['🏍️', '🛵', '🏁'],
  'bici': ['🚴', '🚲', '🚵'],
  'avion': ['✈️', '🛫', '🌍'],
  'avión': ['✈️', '🛫', '🌍'],
  'tren': ['🚂', '🚄', '🚇'],
  'metro': ['🚇', '🚊', '🚉'],
  'gasolina': ['⛽', '🚗', '💨'],
  
  // Entretenimiento
  'cine': ['🎥', '🍿', '🎬'],
  'pelicula': ['🎬', '🎥', '📺'],
  'película': ['🎬', '🎥', '📺'],
  'juego': ['🎮', '🎯', '🎲'],
  'deporte': ['⚽', '🏀', '🎾'],
  'gym': ['🏋️', '💪', '🏃'],
  'gimnasio': ['🏋️', '💪', '🏃'],
  'musica': ['🎵', '🎶', '🎸'],
  'música': ['🎵', '🎶', '🎸'],
  'concierto': ['🎤', '🎸', '🎵'],
  'fiesta': ['🎉', '🎊', '🥳'],
  'viaje': ['✈️', '🌍', '🧳'],
  'hotel': ['🏨', '🛏️', '🏩'],
  
  // Salud
  'salud': ['💊', '🏥', '⚕️'],
  'doctor': ['👨‍⚕️', '🏥', '💉'],
  'medico': ['👨‍⚕️', '🏥', '💊'],
  'médico': ['👨‍⚕️', '🏥', '💊'],
  'farmacia': ['💊', '💉', '🏥'],
  'medicina': ['💊', '💉', '🩺'],
  'dentista': ['🦷', '👨‍⚕️', '🏥'],
  
  // Compras
  'compras': ['🛍️', '🛒', '💳'],
  'ropa': ['👕', '👔', '👗'],
  'zapatos': ['👟', '👠', '👞'],
  'tecnologia': ['💻', '📱', '⌨️'],
  'tecnología': ['💻', '📱', '⌨️'],
  'celular': ['📱', '📲', '💬'],
  'computadora': ['💻', '🖥️', '⌨️'],
  'libro': ['📚', '📖', '📕'],
  'regalo': ['🎁', '🎀', '🎈'],
  
  // Casa y servicios
  'casa': ['🏠', '🏡', '🏘️'],
  'alquiler': ['🏠', '🔑', '🏘️'],
  'luz': ['💡', '⚡', '🔌'],
  'agua': ['💧', '🚿', '🚰'],
  'internet': ['🌐', '📶', '💻'],
  'telefono': ['📱', '☎️', '📞'],
  'teléfono': ['📱', '☎️', '📞'],
  'limpieza': ['🧹', '🧽', '🧼'],
  
  // Educación
  'educacion': ['📚', '🎓', '✏️'],
  'educación': ['📚', '🎓', '✏️'],
  'curso': ['📚', '💻', '🎓'],
  'escuela': ['🏫', '🎒', '📚'],
  'universidad': ['🎓', '🏫', '📚'],
  
  // Mascotas
  'mascota': ['🐾', '🐕', '🐈'],
  'perro': ['🐕', '🐶', '🦴'],
  'gato': ['🐈', '🐱', '🐾'],
  'veterinario': ['🐾', '🏥', '💉'],
  
  // Trabajo
  'trabajo': ['💼', '👔', '🏢'],
  'oficina': ['🏢', '💼', '📊'],
  'negocio': ['💼', '📈', '🏪'],
  
  // Otros
  'seguro': ['🛡️', '📋', '🔒'],
  'banco': ['🏦', '💰', '💳'],
  'impuesto': ['💰', '📊', '🏛️'],
  'donacion': ['❤️', '🎗️', '🤝'],
  'donación': ['❤️', '🎗️', '🤝'],
};

// Categorías extendidas para ingresos
const ALL_INCOME_CATEGORIES = [
  { id: 'salary', label: 'Salario', emoji: '💰' },
  { id: 'bonus', label: 'Bono', emoji: '🎉' },
  { id: 'freelance', label: 'Freelance', emoji: '💼' },
  { id: 'business', label: 'Negocio', emoji: '🏪' },
  { id: 'investment', label: 'Inversiones', emoji: '📈' },
  { id: 'dividend', label: 'Dividendos', emoji: '💹' },
  { id: 'rental', label: 'Renta', emoji: '🏘️' },
  { id: 'sale', label: 'Venta', emoji: '🤝' },
  { id: 'refund', label: 'Reembolso', emoji: '↩️' },
  { id: 'gift-income', label: 'Regalo', emoji: '🎁' },
  { id: 'prize', label: 'Premio', emoji: '🏆' },
  { id: 'scholarship', label: 'Beca', emoji: '🎓' },
];

export default function TransactionModal({ isOpen, onClose, onSave }: TransactionModalProps) {
  const { currency, formatAmount } = useCurrency();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD
  
  // Estados para drag & drop
  const [orderedCategories, setOrderedCategories] = useState<typeof ALL_EXPENSE_CATEGORIES>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Estados para agregar categoría personalizada
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📌');
  const [suggestedEmojis, setSuggestedEmojis] = useState<string[]>(['📌', '⭐', '💡']);
  
  // Cargar orden personalizado desde localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem('categoryOrder');
    if (savedOrder) {
      try {
        setOrderedCategories(JSON.parse(savedOrder));
      } catch (e) {
        setOrderedCategories(ALL_EXPENSE_CATEGORIES);
      }
    } else {
      setOrderedCategories(ALL_EXPENSE_CATEGORIES);
    }
  }, []);
  
  // Guardar orden en localStorage cuando cambie
  useEffect(() => {
    if (orderedCategories.length > 0) {
      localStorage.setItem('categoryOrder', JSON.stringify(orderedCategories));
    }
  }, [orderedCategories]);
  
  // Limpiar temporizador al desmontar
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);
  
  // Sugerir emojis basándose en el texto escrito
  useEffect(() => {
    if (!newCategoryName.trim()) {
      setSuggestedEmojis(['📌', '⭐', '💡']);
      setSelectedEmoji('📌');
      return;
    }
    
    const searchText = newCategoryName.toLowerCase().trim();
    
    // Buscar coincidencias exactas o parciales en las palabras clave
    for (const [keyword, emojis] of Object.entries(EMOJI_SUGGESTIONS)) {
      if (searchText.includes(keyword) || keyword.includes(searchText)) {
        setSuggestedEmojis(emojis);
        setSelectedEmoji(emojis[0]); // Auto-seleccionar el primero
        return;
      }
    }
    
    // Si no hay coincidencias, usar emojis por defecto
    setSuggestedEmojis(['📌', '⭐', '💡']);
    setSelectedEmoji('📌');
  }, [newCategoryName]);
  
  // Función para guardar categoría personalizada
  const handleSaveCustomCategory = () => {
    if (!newCategoryName.trim()) {
      alert('⚠️ Por favor ingresa un nombre para la categoría');
      return;
    }
    
    const customId = `custom-${Date.now()}`;
    const newCategory = {
      id: customId,
      label: newCategoryName.trim(),
      emoji: selectedEmoji,
    };
    
    // Agregar al inicio de las categorías ordenadas
    const updatedCategories = [newCategory, ...orderedCategories];
    setOrderedCategories(updatedCategories);
    
    // Seleccionar la nueva categoría
    setCategory(customId);
    
    // Cerrar modales
    setShowAddCategory(false);
    setShowAllCategories(false);
    
    // Limpiar formulario
    setNewCategoryName('');
    setSelectedEmoji('📌');
    
    // Mostrar confirmación
    alert(`✅ Categoría "${newCategoryName.trim()}" creada exitosamente`);
  };
  
  // Funciones de drag & drop para desktop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    e.dataTransfer.setDragImage(target, rect.width / 2, rect.height / 2);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newOrder = [...orderedCategories];
    const draggedItem = newOrder[draggedIndex];
    
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    
    setOrderedCategories(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  // Funciones de touch para móviles
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    
    // Iniciar temporizador para long press (500ms)
    const timer = setTimeout(() => {
      setDraggedIndex(index);
      // Vibrar si está disponible
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
    
    setLongPressTimer(timer);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null) {
      // Si nos movemos antes del long press, cancelarlo
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      return;
    }
    
    // Prevenir scroll mientras arrastramos
    e.preventDefault();
    
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
      const button = element.closest('button[data-category-index]');
      if (button) {
        const index = parseInt(button.getAttribute('data-category-index') || '-1');
        if (index !== -1 && index !== draggedIndex) {
          setDragOverIndex(index);
        }
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...orderedCategories];
      const draggedItem = newOrder[draggedIndex];
      
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, draggedItem);
      
      setOrderedCategories(newOrder);
      
      // Vibrar para confirmar
      if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30]);
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTouchStartPos(null);
  };

  if (!isOpen) return null;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const allCategories = type === 'expense' ? orderedCategories : ALL_INCOME_CATEGORIES;
  
  // Filtrar categorías según búsqueda
  const filteredCategories = searchTerm 
    ? allCategories.filter(cat => cat.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : allCategories;
  
  const selectedCategory = categories.find(c => c.id === category) || 
                          allCategories.find(c => c.id === category);
                          
  const handleCategoryClick = (catId: string) => {
    if (catId === 'other') {
      setShowAllCategories(true);
    } else {
      setCategory(catId);
      setShowAllCategories(false);
    }
  };

  // Calcular fecha mínima (7 días atrás)
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  // Calcular fecha máxima (hoy)
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleSave = () => {
    if (!amount || !category) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Usar la fecha seleccionada con la hora actual
    const transactionDate = new Date(selectedDate);
    transactionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

    const transaction: Transaction = {
      type,
      amount: parseFloat(amount),
      category,
      paymentMethod,
      description,
      date: transactionDate.toISOString(),
    };

    onSave(transaction);
    
    // Resetear formulario
    setAmount('');
    setCategory('');
    setPaymentMethod('cash');
    setDescription('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-5 flex items-center justify-between rounded-t-3xl z-10 shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {type === 'expense' ? (
                <TrendingDown size={20} className="text-white" />
              ) : (
                <TrendingUp size={20} className="text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {type === 'expense' ? 'Registrar Gasto' : 'Registrar Ingreso'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-hide p-6 pb-6 space-y-6">
          {/* Tipo de transacción - Tabs estilo píldoras */}
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button
                onClick={() => setType('expense')}
                className={`
                  px-6 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2
                  ${type === 'expense' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <TrendingDown size={16} />
                Gasto
              </button>
              <button
                onClick={() => setType('income')}
                className={`
                  px-6 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2
                  ${type === 'income' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <TrendingUp size={16} />
                Ingreso
              </button>
            </div>
          </div>

          {/* Monto - Destacado y centrado */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <label className="block text-sm font-semibold text-gray-600 mb-3 text-center">
              ¿Cuánto?
            </label>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-bold text-gray-400">{currency.symbol}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-32 bg-transparent text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 focus:outline-none text-center"
                style={{ fontFamily: 'Space Mono, monospace' }}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Ingresa el monto de la transacción</p>
          </div>

          {/* Fecha - Carrusel horizontal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              ¿Cuándo fue el gasto?
            </label>
            <div className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Scroll horizontal de días */}
              <div className="flex gap-2 snap-x snap-mandatory py-1">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((daysAgo) => {
                  const date = new Date();
                  date.setDate(date.getDate() - daysAgo);
                  const dateString = date.toISOString().split('T')[0];
                  const isSelected = selectedDate === dateString;
                  
                  // Labels para los días
                  let label = '';
                  if (daysAgo === 0) {
                    label = 'Hoy';
                  } else if (daysAgo === 1) {
                    label = 'Ayer';
                  } else {
                    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                    label = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                  }
                  
                  const dayNumber = date.getDate();
                  const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
                  
                  return (
                    <button
                      key={daysAgo}
                      onClick={() => setSelectedDate(dateString)}
                      className={`
                        flex-shrink-0 w-20 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 snap-center
                        ${isSelected
                          ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg scale-105' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }
                      `}
                    >
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                        {label}
                      </span>
                      <span className={`text-3xl font-extrabold ${isSelected ? 'text-white' : 'text-gray-900'}`} style={{ fontFamily: 'Space Mono, monospace' }}>
                        {dayNumber}
                      </span>
                      <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 pl-1 flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400" />
              <span>Desliza para ver más días · Hasta 7 días atrás</span>
            </p>
          </div>

          {/* Categoría - Carrusel horizontal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Categoría *
            </label>
            <div className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              <div className="flex gap-2 snap-x snap-mandatory py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`
                      flex-shrink-0 w-20 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 snap-center
                      ${category === cat.id 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg scale-105' 
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    <span className="text-3xl">{cat.emoji}</span>
                    <span className={`text-[10px] font-bold text-center ${category === cat.id ? 'text-white' : 'text-gray-700'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Método de pago (solo para gastos) - Carrusel horizontal */}
          {type === 'expense' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Método de pago
              </label>
              <div className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                <div className="flex gap-2 snap-x snap-mandatory py-1">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`
                          flex-shrink-0 w-24 p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 snap-center
                          ${paymentMethod === method.id 
                            ? 'border-blue-500 bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg scale-105' 
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                          }
                        `}
                      >
                        <Icon 
                          size={28} 
                          className={`${paymentMethod === method.id ? 'text-white' : 'text-gray-400'}`} 
                        />
                        <p className={`text-xs font-bold ${paymentMethod === method.id ? 'text-white' : 'text-gray-700'}`}>
                          {method.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <span>💬</span>
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none resize-none text-sm text-gray-900 transition-all"
              placeholder="Ej: Almuerzo en restaurante italiano..."
              rows={3}
            />
          </div>

          {/* Botones - Mejorados */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className={`
                flex-1 py-3.5 px-4 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2
                ${type === 'expense' 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                }
              `}
            >
              {type === 'expense' ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
              Guardar
            </button>
          </div>
          </div>
        </div>
      </div>
      
      {/* Modal de categorías extendidas - Pantalla completa independiente */}
      {showAllCategories && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Seleccionar categoría</h3>
              <button
                onClick={() => {
                  setShowAllCategories(false);
                  setSearchTerm('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            
            {/* Buscador */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar categoría..."
                className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none placeholder-gray-400"
                autoFocus
              />
            </div>
            
            {/* Categoría seleccionada */}
            {category && selectedCategory && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <span className="text-xl">{selectedCategory.emoji}</span>
                <span className="text-sm font-semibold text-blue-900">{selectedCategory.label}</span>
                <span className="text-xs text-blue-600 ml-auto">Seleccionada ✓</span>
              </div>
            )}
          </div>
          
          {/* Lista de categorías - Con scroll y drag & drop */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-2">
            {!searchTerm && (
              <div className="mb-3 px-1">
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <span className="text-base">✋</span>
                  <span>Mantén presionado para reordenar</span>
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 relative">
              {filteredCategories.map((cat, index) => (
                <button
                  key={cat.id}
                  data-category-index={index}
                  draggable={!searchTerm}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onTouchStart={(e) => !searchTerm && handleTouchStart(e, index)}
                  onTouchMove={(e) => !searchTerm && handleTouchMove(e)}
                  onTouchEnd={(e) => !searchTerm && handleTouchEnd(e)}
                  onClick={() => {
                    if (draggedIndex === null) {
                      setCategory(cat.id);
                    }
                  }}
                  className={`
                    p-3 rounded-2xl border-2 transition-all duration-150 flex flex-col items-center gap-1 select-none relative
                    ${!searchTerm ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    ${category === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                    ${draggedIndex === index ? 'opacity-60 scale-105 z-50' : ''}
                    ${dragOverIndex === index && draggedIndex !== index ? 'bg-gray-100 scale-95' : ''}
                  `}
                  style={{
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <span className={`text-2xl pointer-events-none transition-transform duration-150 ${draggedIndex === index ? 'scale-110' : ''}`}>
                    {cat.emoji}
                  </span>
                  <span className={`text-[10px] font-medium text-center pointer-events-none ${category === cat.id ? 'text-blue-600' : 'text-gray-700'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
              
              {/* Botón para añadir categoría personalizada */}
              {!searchTerm && (
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="p-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50 transition-all duration-150 flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span className="text-2xl">➕</span>
                  <span className="text-[10px] font-medium text-center text-gray-600">
                    Añadir
                  </span>
                </button>
              )}
            </div>
            
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm">No se encontraron categorías</p>
                <p className="text-gray-400 text-xs mt-1">Intenta con otro término de búsqueda</p>
              </div>
            )}
          </div>
          
          {/* Botones de acción - SIEMPRE FIJO EN BOTTOM */}
          <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-gray-200 shadow-lg">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAllCategories(false);
                  setSearchTerm('');
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowAllCategories(false);
                  setSearchTerm('');
                }}
                disabled={!category}
                className={`
                  flex-1 py-3.5 px-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                  ${category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {category && <span className="text-xl">{selectedCategory?.emoji}</span>}
                {category ? `Confirmar: ${selectedCategory?.label}` : 'Selecciona una categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para añadir categoría personalizada */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-white z-[70] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Crear Categoría</h3>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                  setSelectedEmoji('📌');
                }}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Nombre de la categoría */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la categoría *
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Mi categoría"
                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 transition-all"
                autoFocus
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1 pl-1">
                {newCategoryName.length}/20 caracteres
              </p>
            </div>
            
            {/* Selector de emoji - Sugerencias automáticas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Emoji sugerido
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Se selecciona automáticamente según el nombre
              </p>
              <div className="flex gap-3 justify-center">
                {suggestedEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`
                      p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center
                      ${selectedEmoji === emoji
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-110 shadow-lg'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:scale-105'
                      }
                    `}
                  >
                    <span className="text-4xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
              <p className="text-xs font-semibold text-gray-600 mb-3 text-center">Vista previa</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl">{selectedEmoji}</span>
                <span className="text-xl font-bold text-gray-900">
                  {newCategoryName || 'Nombre de categoría'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Footer con botones */}
          <div className="flex-shrink-0 p-4 pb-6 bg-white border-t border-gray-200 shadow-lg">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategoryName('');
                  setSelectedEmoji('📌');
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustomCategory}
                disabled={!newCategoryName.trim()}
                className={`
                  flex-1 py-3.5 px-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2
                  ${newCategoryName.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                ✅ Crear Categoría
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



