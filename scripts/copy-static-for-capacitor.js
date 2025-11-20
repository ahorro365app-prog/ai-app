/**
 * Script para preparar archivos estáticos de Next.js para Capacitor
 * 
 * IMPORTANTE: Con output: 'export', Next.js ya genera todos los HTML
 * directamente en out/ con los scripts correctos. Este script solo:
 * 1. Verifica que out/ existe y tiene los archivos necesarios
 * 2. Asegura que los archivos estén listos para Capacitor
 * 3. No modifica los HTML generados por Next.js (ya están correctos)
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = 'out';

console.log('📦 Preparando archivos estáticos para Capacitor...\n');

// Verificar que out/ existe
if (!fs.existsSync(OUT_DIR)) {
  console.error('❌ Error: La carpeta out/ no existe.');
  console.error('   Ejecuta primero: npm run build');
  console.error('   Next.js con output: \'export\' genera los archivos en out/\n');
  process.exit(1);
}

console.log('✅ Carpeta out/ encontrada\n');

// Verificar archivos críticos
const criticalFiles = [
  'index.html',
  'dashboard/index.html',
  'sign-in/index.html',
  '_next/static/chunks/main-app',
  '_next/static/css',
];

let allFilesOk = true;
criticalFiles.forEach(file => {
  const filePath = path.join(OUT_DIR, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    // Para directorios, verificar que existe
    if (file.endsWith('/')) {
      const dirPath = path.join(OUT_DIR, file.replace(/\/$/, ''));
      if (fs.existsSync(dirPath)) {
        console.log(`✅ ${file} (directorio)`);
      } else {
        console.log(`⚠️  ${file} no encontrado`);
        allFilesOk = false;
      }
    } else {
      // Buscar archivos que empiecen con el nombre (para chunks con hash)
      const dir = path.dirname(filePath);
      const baseName = path.basename(file);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const found = files.some(f => f.startsWith(baseName));
        if (found) {
          console.log(`✅ ${file} (encontrado con hash)`);
        } else {
          console.log(`⚠️  ${file} no encontrado`);
          allFilesOk = false;
        }
      } else {
        console.log(`⚠️  ${file} no encontrado`);
        allFilesOk = false;
      }
    }
  }
});

if (!allFilesOk) {
  console.log('\n⚠️  Algunos archivos críticos no se encontraron.');
  console.log('   Esto puede ser normal si el build está incompleto.');
  console.log('   Verifica que npm run build se ejecutó correctamente.\n');
}

// Verificar estructura de _next/static
const nextStaticDir = path.join(OUT_DIR, '_next', 'static');
if (fs.existsSync(nextStaticDir)) {
  console.log('\n📁 Estructura de _next/static:');
  
  const chunksDir = path.join(nextStaticDir, 'chunks');
  const cssDir = path.join(nextStaticDir, 'css');
  
  if (fs.existsSync(chunksDir)) {
    const chunkFiles = fs.readdirSync(chunksDir, { recursive: true });
    const jsFiles = chunkFiles.filter(f => f.endsWith('.js'));
    console.log(`   ✅ chunks/ - ${jsFiles.length} archivos JS`);
  }
  
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir);
    console.log(`   ✅ css/ - ${cssFiles.length} archivos CSS`);
  }
} else {
  console.log('\n⚠️  Carpeta _next/static no encontrada');
  console.log('   Los scripts de Next.js pueden no cargarse correctamente\n');
}

// Verificar que los HTML tienen los scripts correctos
console.log('\n📄 Verificando HTML generados...');

function checkHtmlFile(htmlPath, routeName) {
  if (!fs.existsSync(htmlPath)) {
    console.log(`   ⚠️  ${routeName}: HTML no encontrado`);
    return false;
  }
  
  const content = fs.readFileSync(htmlPath, 'utf8');
  const hasNextScripts = content.includes('_next/static/chunks');
  const hasMainApp = content.includes('main-app') || content.includes('main-abc');
  const hasReact = content.includes('__next_f') || content.includes('react');
  
  if (hasNextScripts && hasMainApp && hasReact) {
    console.log(`   ✅ ${routeName}: HTML correcto (tiene scripts de Next.js)`);
    return true;
  } else {
    console.log(`   ⚠️  ${routeName}: HTML puede estar incompleto`);
    if (!hasNextScripts) console.log(`      - Falta: scripts de Next.js`);
    if (!hasMainApp) console.log(`      - Falta: main-app chunk`);
    if (!hasReact) console.log(`      - Falta: React/Next.js runtime`);
    return false;
  }
}

const htmlFiles = [
  { path: path.join(OUT_DIR, 'index.html'), name: 'index.html (raíz)' },
  { path: path.join(OUT_DIR, 'dashboard', 'index.html'), name: 'dashboard/index.html' },
  { path: path.join(OUT_DIR, 'sign-in', 'index.html'), name: 'sign-in/index.html' },
];

let htmlOk = true;
htmlFiles.forEach(({ path: htmlPath, name }) => {
  if (!checkHtmlFile(htmlPath, name)) {
    htmlOk = false;
  }
});

// Resumen final
console.log('\n' + '='.repeat(60));
if (allFilesOk && htmlOk) {
  console.log('✅ Todos los archivos están listos para Capacitor');
  console.log('💡 Los HTML ya tienen los scripts correctos (generados por Next.js)');
  console.log('💡 No es necesario modificar los HTML manualmente');
} else {
  console.log('⚠️  Algunos archivos pueden necesitar atención');
  console.log('💡 Verifica los mensajes anteriores');
}
console.log('='.repeat(60));

console.log('\n✅ Archivos preparados para Capacitor');
console.log('💡 Ahora ejecuta: npx cap sync android\n');
