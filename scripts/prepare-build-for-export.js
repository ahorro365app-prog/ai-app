/**
 * Script para preparar el build con output: 'export'
 * Renombra temporalmente src/app/api/ a src/app/_api/ para que Next.js lo ignore
 * Las rutas API están en packages/core-api/ para producción
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const API_DIR_RENAMED = path.join(process.cwd(), 'src', 'app', '_api');

console.log('🔧 Preparando build para export estático...\n');

// Verificar si existe la carpeta api
if (fs.existsSync(API_DIR)) {
  console.log('📁 Renombrando src/app/api/ a src/app/_api/ (temporal)...');
  
  // Renombrar la carpeta
  try {
    fs.renameSync(API_DIR, API_DIR_RENAMED);
    console.log('✅ Carpeta renombrada correctamente');
    console.log('   Next.js ignorará _api/ durante el build\n');
  } catch (error) {
    console.error('❌ Error renombrando carpeta:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  Carpeta src/app/api/ no encontrada (ya renombrada?)\n');
}

console.log('✅ Preparación completada. Puedes ejecutar: npm run build\n');

