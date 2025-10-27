"use client";

import { useState, useEffect } from "react";
import { X, TrendingDown, TrendingUp, Wallet, CreditCard, Smartphone, Banknote, MoreHorizontal, Search, Calendar } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency";
import { useModal } from "@/contexts/ModalContext";

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
  { id: 'comida', label: 'Comida', emoji: '🍽️' },
  { id: 'transporte', label: 'Transporte', emoji: '🚗' },
  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬' },
  { id: 'compras', label: 'Compras', emoji: '🛍️' },
  { id: 'salud', label: 'Salud', emoji: '💊' },
  { id: 'servicios', label: 'Servicios', emoji: '💡' },
  { id: 'otro', label: 'Otro', emoji: '📦' },
];

const INCOME_CATEGORIES = [
  { id: 'salario', label: 'Salario', emoji: '💰' },
  { id: 'freelance', label: 'Freelance', emoji: '💼' },
  { id: 'inversion', label: 'Inversión', emoji: '📈' },
  { id: 'regalo', label: 'Regalo', emoji: '🎁' },
  { id: 'otro', label: 'Otro', emoji: '💵' },
];

// Categorías extendidas para gastos
const ALL_EXPENSE_CATEGORIES = [
  { id: 'restaurante', label: 'Restaurante', emoji: '🍴' },
  { id: 'supermercado', label: 'Supermercado', emoji: '🛒' },
  { id: 'cafe', label: 'Café', emoji: '☕' },
  { id: 'comida-rapida', label: 'Comida rápida', emoji: '🍔' },
  { id: 'taxi', label: 'Taxi/Uber', emoji: '🚕' },
  { id: 'autobus', label: 'Autobús', emoji: '🚌' },
  { id: 'gasolina', label: 'Gasolina', emoji: '⛽' },
  { id: 'estacionamiento', label: 'Estacionamiento', emoji: '🅿️' },
  { id: 'cine', label: 'Cine', emoji: '🎥' },
  { id: 'concierto', label: 'Concierto', emoji: '🎵' },
  { id: 'deportes', label: 'Deportes', emoji: '⚽' },
  { id: 'videojuegos', label: 'Videojuegos', emoji: '🎮' },
  { id: 'ropa', label: 'Ropa', emoji: '👕' },
  { id: 'calzado', label: 'Calzado', emoji: '👟' },
  { id: 'electronica', label: 'Electrónica', emoji: '💻' },
  { id: 'muebles', label: 'Muebles', emoji: '🛋️' },
  { id: 'medico', label: 'Médico', emoji: '👨‍⚕️' },
  { id: 'farmacia', label: 'Farmacia', emoji: '💊' },
  { id: 'gimnasio', label: 'Gimnasio', emoji: '🏋️' },
  { id: 'belleza', label: 'Belleza', emoji: '💄' },
  { id: 'luz', label: 'Luz', emoji: '💡' },
  { id: 'agua', label: 'Agua', emoji: '💧' },
  { id: 'internet', label: 'Internet', emoji: '🌐' },
  { id: 'telefono', label: 'Teléfono', emoji: '📱' },
  { id: 'alquiler', label: 'Alquiler', emoji: '🏠' },
  { id: 'seguro', label: 'Seguro', emoji: '🛡️' },
  { id: 'educacion', label: 'Educación', emoji: '📚' },
  { id: 'libros', label: 'Libros', emoji: '📖' },
  { id: 'regalos', label: 'Regalos', emoji: '🎁' },
  { id: 'donaciones', label: 'Donaciones', emoji: '❤️' },
  { id: 'mascotas', label: 'Mascotas', emoji: '🐾' },
  { id: 'viajes', label: 'Viajes', emoji: '✈️' },
  { id: 'hotel', label: 'Hotel', emoji: '🏨' },
  { id: 'suscripciones', label: 'Suscripciones', emoji: '📺' },
];

// Función para migrar IDs de categorías de inglés a español
const migrateOldCategories = () => {
  try {
    console.log('🔧 Iniciando migración de categorías...');
    
    // Mapeo de IDs antiguos (inglés) a nuevos (español)
    const categoryIdMapping: Record<string, string> = {
      // Gastos básicos
      'food': 'comida',
      'transport': 'transporte',
      'entertainment': 'entretenimiento',
      'shopping': 'compras',
      'health': 'salud',
      'bills': 'servicios',
      'other': 'otro',
      
      // Ingresos básicos
      'salary': 'salario',
      'investment': 'inversion',
      'gift': 'regalo',
      
      // Ingresos extendidos
      'sale': 'venta',
      'bonus': 'bono',
      'freelance': 'freelance',
      'business': 'negocio',
      'dividend': 'dividendos',
      'rental': 'renta',
      'refund': 'reembolso',
      'gift-income': 'regalo',
      'prize': 'premio',
      'scholarship': 'beca',
      
      // Gastos extendidos
      'restaurant': 'restaurante',
      'groceries': 'supermercado',
      'coffee': 'cafe',
      'fast-food': 'comida-rapida',
      'bus': 'autobus',
      'gas': 'gasolina',
      'parking': 'estacionamiento',
      'cinema': 'cine',
      'concert': 'concierto',
      'sports': 'deportes',
      'games': 'videojuegos',
      'clothes': 'ropa',
      'shoes': 'calzado',
      'electronics': 'electronica',
      'furniture': 'muebles',
      'doctor': 'medico',
      'pharmacy': 'farmacia',
      'gym': 'gimnasio',
      'beauty': 'belleza',
      'electricity': 'luz',
      'water': 'agua',
      'phone': 'telefono',
      'rent': 'alquiler',
      'insurance': 'seguro',
      'education': 'educacion',
      'books': 'libros',
      'gifts': 'regalos',
      'donations': 'donaciones',
      'pets': 'mascotas',
      'travel': 'viajes',
      'subscriptions': 'suscripciones'
    };
    
    // 1. Migrar transacciones en localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const transactions = JSON.parse(savedTransactions);
      let needsUpdate = false;
      
      const migratedTransactions = transactions.map((tx: any) => {
        if (categoryIdMapping[tx.category]) {
          needsUpdate = true;
          console.log(`🔄 Migrando categoría: ${tx.category} → ${categoryIdMapping[tx.category]}`);
          return { ...tx, category: categoryIdMapping[tx.category] };
        }
        return tx;
      });
      
      if (needsUpdate) {
        localStorage.setItem('transactions', JSON.stringify(migratedTransactions));
        console.log('✅ Transacciones migradas en localStorage');
      }
    }
    
    // 2. Migrar categorías personalizadas
    const storedCategories = localStorage.getItem('customCategories');
    if (storedCategories) {
      const customCategories = JSON.parse(storedCategories);
      let needsUpdate = false;
      
      const migratedCategories = customCategories.map((cat: any) => {
        if (categoryIdMapping[cat.id]) {
          needsUpdate = true;
          console.log(`🔄 Migrando categoría personalizada: ${cat.id} → ${categoryIdMapping[cat.id]}`);
          return { ...cat, id: categoryIdMapping[cat.id] };
        }
        return cat;
      });
      
      if (needsUpdate) {
        localStorage.setItem('customCategories', JSON.stringify(migratedCategories));
        console.log('✅ Categorías personalizadas migradas');
      }
    }
    
    console.log('✅ Migración de categorías completada');
  } catch (error) {
    console.warn('Error al migrar categorías:', error);
  }
};

// Función para reconstruir categorías personalizadas desde transacciones
const rebuildCustomCategories = (): void => {
  try {
    console.log('🔧 Reconstruyendo categorías personalizadas...');
    
    // Obtener todas las transacciones del localStorage
    const savedTransactions = localStorage.getItem('transactions');
    if (!savedTransactions) return;
    
    const transactions = JSON.parse(savedTransactions);
    const customCategories: any[] = [];
    
    // Buscar categorías que empiecen con 'custom-'
    transactions.forEach((tx: any) => {
      if (tx.category && tx.category.startsWith('custom-')) {
        // Verificar si ya existe
        const exists = customCategories.some(cat => cat.id === tx.category);
        if (!exists) {
          // Extraer el nombre de la categoría del ID (después de 'custom-')
          const categoryName = tx.category.replace('custom-', '').replace(/-/g, ' ');
          const label = categoryName
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          customCategories.push({
            id: tx.category,
            label: label,
            emoji: '📦' // Emoji por defecto
          });
        }
      }
    });
    
    if (customCategories.length > 0) {
      console.log('📋 Categorías reconstruidas:', customCategories);
      localStorage.setItem('customCategories', JSON.stringify(customCategories));
      console.log('✅ Categorías personalizadas reconstruidas y guardadas');
    } else {
      console.log('ℹ️ No se encontraron categorías personalizadas para reconstruir');
    }
  } catch (error) {
    console.warn('Error al reconstruir categorías personalizadas:', error);
  }
};

// Función para obtener el label de una categoría por su ID
export const getCategoryLabel = (categoryId: string): string => {
  console.log('🔍 Buscando categoría para ID:', categoryId);
  
  // Si el categoryId no es un ID sino texto directo (como "Sale"), devolverlo tal como está
  if (!categoryId.startsWith('custom-') && !categoryId.includes('_') && !categoryId.includes('-')) {
    console.log('✅ Categoría como texto directo:', categoryId);
    return categoryId;
  }
  
  // Mapeo temporal para IDs antiguos (inglés) a nuevos (español)
  const categoryIdMapping: Record<string, string> = {
    // Gastos básicos
    'food': 'comida',
    'transport': 'transporte',
    'entertainment': 'entretenimiento',
    'shopping': 'compras',
    'health': 'salud',
    'bills': 'servicios',
    'other': 'otro',
    
    // Ingresos básicos
    'salary': 'salario',
    'investment': 'inversion',
    'gift': 'regalo',
    
    // Ingresos extendidos
    'sale': 'venta',
    'bonus': 'bono',
    'freelance': 'freelance',
    'business': 'negocio',
    'dividend': 'dividendos',
    'rental': 'renta',
    'refund': 'reembolso',
    'gift-income': 'regalo',
    'prize': 'premio',
    'scholarship': 'beca',
    
    // Gastos extendidos
    'restaurant': 'restaurante',
    'groceries': 'supermercado',
    'coffee': 'cafe',
    'fast-food': 'comida-rapida',
    'bus': 'autobus',
    'gas': 'gasolina',
    'parking': 'estacionamiento',
    'cinema': 'cine',
    'concert': 'concierto',
    'sports': 'deportes',
    'games': 'videojuegos',
    'clothes': 'ropa',
    'shoes': 'calzado',
    'electronics': 'electronica',
    'furniture': 'muebles',
    'doctor': 'medico',
    'pharmacy': 'farmacia',
    'gym': 'gimnasio',
    'beauty': 'belleza',
    'electricity': 'luz',
    'water': 'agua',
    'phone': 'telefono',
    'rent': 'alquiler',
    'insurance': 'seguro',
    'education': 'educacion',
    'books': 'libros',
    'gifts': 'regalos',
    'donations': 'donaciones',
    'pets': 'mascotas',
    'travel': 'viajes',
    'subscriptions': 'suscripciones'
  };
  
  // Si es un ID antiguo, convertirlo al nuevo
  const finalCategoryId = categoryIdMapping[categoryId] || categoryId;
  
  // Buscar en las categorías predefinidas (ahora con IDs en español)
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...ALL_EXPENSE_CATEGORIES];
  const predefinedCategory = allCategories.find(cat => cat.id === finalCategoryId);
  if (predefinedCategory) {
    console.log('✅ Encontrada en categorías predefinidas:', predefinedCategory.label);
    return predefinedCategory.label;
  }
  
  // Si no se encuentra, buscar en las categorías personalizadas almacenadas
  try {
    const storedCategories = localStorage.getItem('customCategories');
    if (storedCategories) {
      const customCategories = JSON.parse(storedCategories);
      const customCategory = customCategories.find((cat: any) => cat.id === finalCategoryId);
      
      if (customCategory) {
        console.log('✅ Encontrada en categorías personalizadas:', customCategory.label);
        return customCategory.label;
      }
    }
  } catch (error) {
    console.warn('Error al cargar categorías personalizadas:', error);
  }
  
  // Si no se encuentra en ningún lado, devolver el categoryId tal como está
  console.log('🔄 Devolviendo categoryId tal como está:', categoryId);
  return categoryId;
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
  const { setModalOpen } = useModal();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Función para obtener la fecha de hoy en formato local YYYY-MM-DD
  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    console.log('📅 Fecha de hoy calculada:', result, '→', new Date(result + 'T00:00:00'));
    return result;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  
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
  
  // Manejar el estado del modal para ocultar el Navbar
  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
    
    // Cleanup cuando el componente se desmonta
    return () => {
      setModalOpen(false);
    };
  }, [isOpen, setModalOpen]);

  // Cargar orden personalizado desde localStorage
  useEffect(() => {
    // Migrar categorías antiguas primero
    migrateOldCategories();
    
    const savedOrder = localStorage.getItem('categoryOrder');
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        setOrderedCategories(parsedOrder);
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
    
    // Guardar en localStorage para persistencia
    try {
      const existingCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
      
      // Eliminar duplicados basándose en el ID
      const uniqueCategories = existingCategories.filter((cat: any) => cat.id !== customId);
      
      // Agregar la nueva categoría al inicio
      const updatedStoredCategories = [newCategory, ...uniqueCategories];
      
      localStorage.setItem('customCategories', JSON.stringify(updatedStoredCategories));
      console.log('💾 Categoría personalizada guardada:', newCategory);
      console.log('📦 Todas las categorías personalizadas:', updatedStoredCategories);
    } catch (error) {
      console.warn('Error al guardar categoría personalizada:', error);
    }
    
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
    console.log('🔍 Categoría clickeada:', catId);
    if (catId === 'otro') {
      console.log('📂 Abriendo menú de categorías personalizadas');
      setShowAllCategories(true);
    } else {
      console.log('✅ Seleccionando categoría:', catId);
      setCategory(catId);
      setShowAllCategories(false);
    }
  };

  // Calcular fecha mínima (6 días atrás)
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    console.log('📅 Fecha mínima calculada:', result, '→', new Date(result + 'T00:00:00'));
    return result;
  };

  // Calcular fecha máxima (hoy)
  const getMaxDate = () => {
    const result = getTodayLocalDate();
    console.log('📅 Fecha máxima calculada:', result, '→', new Date(result + 'T23:59:59'));
    return result;
  };

  const handleSave = () => {
    if (!amount || !category) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar que la fecha esté dentro del rango permitido
    const minDate = getMinDate();
    const maxDate = getMaxDate();
    
    // Convertir fechas a objetos Date para comparación correcta (usando hora local)
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const minDateObj = new Date(minDate + 'T00:00:00');
    const maxDateObj = new Date(maxDate + 'T23:59:59');
    
    console.log('🔍 Validación de fechas:');
    console.log('Fecha seleccionada:', selectedDate, '→', selectedDateObj);
    console.log('Fecha mínima:', minDate, '→', minDateObj);
    console.log('Fecha máxima:', maxDate, '→', maxDateObj);
    console.log('Es menor que mínima:', selectedDateObj < minDateObj);
    console.log('Es mayor que máxima:', selectedDateObj > maxDateObj);
    
    if (selectedDateObj < minDateObj || selectedDateObj > maxDateObj) {
      alert('La fecha debe estar dentro de los últimos 6 días');
      return;
    }

    // Usar la fecha seleccionada con la hora actual (en hora local, no UTC)
    const now = new Date();
    const [year, month, day] = selectedDate.split('-').map(Number);
    const transactionDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

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
    setSelectedDate(getTodayLocalDate());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header fijo */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mx-auto mb-4 flex items-center justify-center">
            {type === 'expense' ? (
              <TrendingDown size={32} className="text-blue-600" />
            ) : (
              <TrendingUp size={32} className="text-green-600" />
            )}
          </div>

          <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {type === 'expense' ? 'Registrar Gasto' : 'Registrar Ingreso'}
          </h3>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-4 mb-6">
            {/* Tipo de transacción */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Tipo de transacción *
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setType('expense')}
                  className={`
                    flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
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
                    flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2
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

            {/* Monto */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Monto *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none modal-input"
                autoFocus
              />
            </div>

            {/* Fecha - Carrusel de botones */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Fecha *
              </label>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() - i);
                  // Usar fecha local en lugar de UTC para evitar problemas de zona horaria
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const dateString = `${year}-${month}-${day}`;
                  const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNumber = date.getDate();
                  const monthName = date.toLocaleDateString('es-ES', { month: 'short' });
                  const isToday = i === 0;
                  const isSelected = selectedDate === dateString;
                  
                  console.log(`📅 Botón fecha ${i}: ${dateString} (${dayName} ${dayNumber} ${monthName}) - Seleccionado: ${isSelected}`);
                  
                  return (
                    <button
                      key={dateString}
                      type="button"
                      onClick={() => setSelectedDate(dateString)}
                      className={`
                        flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-w-[60px] snap-center
                        ${isSelected 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-blue-500 text-white shadow-lg' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }
                        ${isToday ? 'ring-2 ring-blue-200' : ''}
                      `}
                    >
                      <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                        {dayName}
                      </span>
                      <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {dayNumber}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                        {monthName}
                      </span>
                      {isToday && (
                        <span className="text-[8px] bg-blue-600 text-white px-1 rounded-full mt-1">
                          HOY
                        </span>
                      )}
                    </button>
                  );
                })}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Solo puedes registrar gastos de los últimos 6 días
              </p>
            </div>

            {/* Categoría - Carrusel */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Categoría *
              </label>
              <div className="relative">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`
                        flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-w-[80px] snap-center
                        ${category === cat.id 
                          ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg text-white' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                        }
                      `}
                    >
                      <span className="text-lg mb-1">{cat.emoji}</span>
                      <span className={`text-xs font-bold text-center ${category === cat.id ? 'text-white' : 'text-gray-700'}`}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Método de pago (solo para gastos) - Carrusel */}
            {type === 'expense' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Método de pago
                </label>
                <div className="relative">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory px-1">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id)}
                          className={`
                            flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all min-w-[80px] snap-center
                            ${paymentMethod === method.id 
                              ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg text-white' 
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                            }
                          `}
                        >
                          <Icon 
                            size={20} 
                            className={`${paymentMethod === method.id ? 'text-white' : 'text-gray-400'}`} 
                          />
                          <p className={`text-xs font-bold text-center mt-1 ${paymentMethod === method.id ? 'text-white' : 'text-gray-700'}`}>
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
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none modal-input"
                placeholder="Ej: Almuerzo en restaurante italiano..."
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex-shrink-0 pt-4 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className={`
                flex-1 py-3.5 px-4 rounded-xl font-semibold text-white transition-all shadow-lg
                ${type === 'expense' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:opacity-90'
                }
              `}
            >
              {type === 'expense' ? 'Registrar Gasto' : 'Registrar Ingreso'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal de categorías extendidas - Pantalla completa independiente */}
      {showAllCategories && (
        <div className="fixed inset-0 bg-white z-[60] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Seleccionar categoría</h3>
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
                <span className="text-xl font-semibold text-blue-900">{selectedCategory.label}</span>
                <span className="text-xl text-blue-600 ml-auto">Seleccionada ✓</span>
              </div>
            )}
          </div>
          
          {/* Lista de categorías - Con scroll y drag & drop */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 pb-2">
            {!searchTerm && (
              <div className="mb-3 px-1">
                <p className="text-xl text-gray-500 flex items-center gap-1.5">
                  <span className="text-xl">✋</span>
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
                  <span className={`text-xl pointer-events-none transition-transform duration-150 ${draggedIndex === index ? 'scale-110' : ''}`}>
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
                  <span className="text-xl">➕</span>
                  <span className="text-[10px] font-medium text-center text-gray-600">
                    Añadir
                  </span>
                </button>
              )}
            </div>
            
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-xl">No se encontraron categorías</p>
                <p className="text-gray-400 text-xl mt-1">Intenta con otro término de búsqueda</p>
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
              <h3 className="text-xl font-bold text-white">Crear Categoría</h3>
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
              <label className="block text-xl font-semibold text-gray-700 mb-2">
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
              <p className="text-xl text-gray-500 mt-1 pl-1">
                {newCategoryName.length}/20 caracteres
              </p>
            </div>
            
            {/* Selector de emoji - Sugerencias automáticas */}
            <div>
              <label className="block text-xl font-semibold text-gray-700 mb-2">
                Emoji sugerido
              </label>
              <p className="text-xl text-gray-500 mb-3">
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
                    <span className="text-xl">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200">
              <p className="text-xl font-semibold text-gray-600 mb-3 text-center">Vista previa</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">{selectedEmoji}</span>
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



