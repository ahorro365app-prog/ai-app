// Script para migrar categorías de inglés a español
// Ejecutar en la consola del navegador

console.log('🔧 Iniciando migración de categorías...');

// Mapeo de IDs antiguos (inglés) a nuevos (español)
const categoryIdMapping = {
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

try {
  // 1. Migrar transacciones en localStorage
  const savedTransactions = localStorage.getItem('transactions');
  if (savedTransactions) {
    const transactions = JSON.parse(savedTransactions);
    let needsUpdate = false;
    
    const migratedTransactions = transactions.map((tx) => {
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
    } else {
      console.log('ℹ️ No hay transacciones que migrar');
    }
  } else {
    console.log('ℹ️ No hay transacciones en localStorage');
  }
  
  // 2. Migrar categorías personalizadas
  const storedCategories = localStorage.getItem('customCategories');
  if (storedCategories) {
    const customCategories = JSON.parse(storedCategories);
    let needsUpdate = false;
    
    const migratedCategories = customCategories.map((cat) => {
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
    } else {
      console.log('ℹ️ No hay categorías personalizadas que migrar');
    }
  } else {
    console.log('ℹ️ No hay categorías personalizadas en localStorage');
  }
  
  console.log('✅ Migración de categorías completada');
  
} catch (error) {
  console.error('❌ Error durante la migración:', error);
}

// Mostrar estado actual
console.log('\n📊 Estado actual del localStorage:');
console.log('Transacciones:', localStorage.getItem('transactions') ? 'Existen' : 'No existen');
console.log('Categorías personalizadas:', localStorage.getItem('customCategories') ? 'Existen' : 'No existen');
