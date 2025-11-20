/**
 * Script para build con output: 'export'
 * Renombra temporalmente src/app/api/ a src/app/_api/ antes del build
 * y lo restaura después, para que Next.js ignore las rutas API durante el export
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_DIR = path.join(process.cwd(), 'src', 'app', 'api');
const API_DIR_RENAMED = path.join(process.cwd(), 'src', 'app', '_api');

console.log('🔧 Preparando build para export estático...\n');

// 1. Renombrar api/ a _api/
if (fs.existsSync(API_DIR)) {
  try {
    // Si ya existe _api/, eliminarla primero
    if (fs.existsSync(API_DIR_RENAMED)) {
      console.log('⚠️  Carpeta _api/ ya existe, eliminando...');
      fs.rmSync(API_DIR_RENAMED, { recursive: true, force: true });
    }
    
    fs.renameSync(API_DIR, API_DIR_RENAMED);
    console.log('✅ Carpeta api/ renombrada a _api/');
    console.log('   Next.js ignorará _api/ durante el build\n');
  } catch (error) {
    console.error('❌ Error renombrando carpeta:', error.message);
    console.error('\n💡 Solución:');
    console.error('   1. Cierra el servidor de desarrollo (npm run dev)');
    console.error('   2. Cierra cualquier editor que tenga archivos de api/ abiertos');
    console.error('   3. Vuelve a ejecutar: npm run build\n');
    process.exit(1);
  }
} else {
  console.log('⚠️  Carpeta src/app/api/ no encontrada (ya renombrada?)\n');
}

// 2. Ejecutar build
try {
  console.log('🔄 Ejecutando build de Next.js...\n');
  execSync('next build', { stdio: 'inherit', cwd: process.cwd() });
  console.log('\n✅ Build completado exitosamente\n');
} catch (error) {
  // Restaurar carpeta incluso si el build falla
  console.log('\n⚠️  Build falló, restaurando carpeta api/...\n');
  if (fs.existsSync(API_DIR_RENAMED)) {
    try {
      fs.renameSync(API_DIR_RENAMED, API_DIR);
      console.log('✅ Carpeta api/ restaurada');
    } catch (restoreError) {
      console.error('❌ Error restaurando carpeta:', restoreError.message);
      console.error('   Restaura manualmente: Rename-Item src/app/_api src/app/api');
    }
  }
  process.exit(1);
}

// 3. Restaurar _api/ a api/
if (fs.existsSync(API_DIR_RENAMED)) {
  try {
    fs.renameSync(API_DIR_RENAMED, API_DIR);
    console.log('✅ Carpeta api/ restaurada correctamente\n');
  } catch (error) {
    console.error('❌ Error restaurando carpeta:', error.message);
    console.error('\n💡 Restaura manualmente:');
    console.error('   PowerShell: Rename-Item src/app/_api src/app/api');
    console.error('   O desde el explorador de archivos\n');
    process.exit(1);
  }
} else {
  console.log('⚠️  Carpeta _api/ no encontrada (ya restaurada?)\n');
}

console.log('✅ Proceso completado\n');

