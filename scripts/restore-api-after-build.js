/**
 * Script para restaurar la carpeta api después del build
 * Restaura src/app/_api/ a src/app/api/
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const API_DIR_RENAMED = path.join(process.cwd(), 'src', 'app', '_api');

console.log('🔄 Restaurando carpeta api después del build...\n');

// Verificar si existe la carpeta renombrada
if (fs.existsSync(API_DIR_RENAMED)) {
  console.log('📁 Restaurando src/app/_api/ a src/app/api/...');
  
  // Si ya existe api/, eliminarla primero
  if (fs.existsSync(API_DIR)) {
    console.log('⚠️  Carpeta api/ ya existe, eliminando...');
    fs.rmSync(API_DIR, { recursive: true, force: true });
  }
  
  // Renombrar de vuelta
  try {
    fs.renameSync(API_DIR_RENAMED, API_DIR);
    console.log('✅ Carpeta restaurada correctamente\n');
  } catch (error) {
    console.error('❌ Error restaurando carpeta:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  Carpeta src/app/_api/ no encontrada (ya restaurada?)\n');
}

console.log('✅ Restauración completada\n');

