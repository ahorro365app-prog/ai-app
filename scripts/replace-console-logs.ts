/**
 * Script para reemplazar console.* con logger.* en archivos del admin dashboard
 * Ejecutar con: npx tsx scripts/replace-console-logs.ts
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface Replacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

interface FileChange {
  file: string;
  changes: number;
  importsAdded: boolean;
  errors: string[];
}

const results: FileChange[] = [];

// Directorio base - __dirname apunta a scripts/, necesitamos ir a admin-dashboard/src
const projectRoot = join(__dirname, '..');
const adminDashboardPath = join(projectRoot, 'admin-dashboard', 'src');

// Patrones de reemplazo
const replacements: Replacement[] = [
  // console.error → logger.error
  {
    pattern: /console\.error\(/g,
    replacement: 'logger.error(',
    description: 'console.error → logger.error'
  },
  // console.warn → logger.warn
  {
    pattern: /console\.warn\(/g,
    replacement: 'logger.warn(',
    description: 'console.warn → logger.warn'
  },
  // console.log con emojis de éxito → logger.success
  {
    pattern: /console\.log\(['"`]✅/g,
    replacement: 'logger.success(',
    description: 'console.log(✅ → logger.success('
  },
  // console.log con otros emojis o texto → logger.debug
  {
    pattern: /console\.log\(/g,
    replacement: 'logger.debug(',
    description: 'console.log → logger.debug'
  },
];

// Función para verificar si el archivo ya tiene el import
function hasLoggerImport(content: string): boolean {
  return /import.*logger.*from.*['"]@\/lib\/logger['"]/.test(content) ||
         /import.*\{.*logger.*\}.*from.*['"]@\/lib\/logger['"]/.test(content);
}

// Función para agregar el import
function addLoggerImport(content: string): string {
  // Buscar la última línea de import
  const lines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    } else if (lastImportIndex !== -1 && lines[i].trim() === '') {
      // Si encontramos un import y luego una línea vacía, insertar aquí
      break;
    }
  }
  
  // Si no hay imports, agregar al inicio
  if (lastImportIndex === -1) {
    return `import { logger } from '@/lib/logger';\n${content}`;
  }
  
  // Insertar después del último import
  const importLine = "import { logger } from '@/lib/logger';";
  lines.splice(lastImportIndex + 1, 0, importLine);
  return lines.join('\n');
}

// Función para procesar un archivo
function processFile(filePath: string): FileChange {
  const result: FileChange = {
    file: filePath,
    changes: 0,
    importsAdded: false,
    errors: []
  };

  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Verificar si tiene console.*
    if (!/console\.(log|error|warn|debug)\(/.test(content)) {
      return result; // No hay console.*, saltar
    }
    
    // Aplicar reemplazos
    for (const replacement of replacements) {
      const matches = content.match(replacement.pattern);
      if (matches) {
        content = content.replace(replacement.pattern, replacement.replacement);
        result.changes += matches.length;
      }
    }
    
    // Verificar si necesita import
    if (result.changes > 0 && !hasLoggerImport(content)) {
      content = addLoggerImport(content);
      result.importsAdded = true;
    }
    
    // Solo escribir si hubo cambios
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
    }
    
  } catch (error: any) {
    result.errors.push(error.message);
  }
  
  return result;
}

// Función recursiva para encontrar archivos
function findFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (stat.isFile() && (extname(file) === '.ts' || extname(file) === '.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Función principal
function main() {
  console.log('🔍 Buscando archivos con console.*...\n');
  
  // Buscar todos los archivos TypeScript/JavaScript en admin-dashboard/src/app/api
  const apiDir = join(adminDashboardPath, 'app', 'api');
  const apiFiles: string[] = [];
  
  if (existsSync(apiDir)) {
    findFiles(apiDir, apiFiles);
  }
  
  // También buscar en middleware
  const middlewareFile = join(adminDashboardPath, 'middleware.ts');
  if (existsSync(middlewareFile)) {
    apiFiles.push(middlewareFile);
  }
  
  console.log(`📁 Encontrados ${apiFiles.length} archivos para procesar\n`);
  
  // Procesar cada archivo
  for (const file of apiFiles) {
    const result = processFile(file);
    if (result.changes > 0 || result.errors.length > 0) {
      results.push(result);
      const relativePath = file.replace(projectRoot, '.').replace(/\\/g, '/');
      console.log(`✅ ${relativePath}`);
      console.log(`   Cambios: ${result.changes}`);
      if (result.importsAdded) {
        console.log(`   ✅ Import agregado`);
      }
      if (result.errors.length > 0) {
        console.log(`   ❌ Errores: ${result.errors.join(', ')}`);
      }
    }
  }
  
  // Resumen
  console.log('\n📊 RESUMEN\n');
  const totalChanges = results.reduce((sum, r) => sum + r.changes, 0);
  const totalImports = results.filter(r => r.importsAdded).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  
  console.log(`Total de archivos modificados: ${results.length}`);
  console.log(`Total de reemplazos: ${totalChanges}`);
  console.log(`Imports agregados: ${totalImports}`);
  console.log(`Errores: ${totalErrors}`);
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Algunos archivos tuvieron errores. Revisa manualmente.');
    process.exit(1);
  } else {
    console.log('\n✅ Todos los archivos procesados exitosamente!');
    console.log('\n💡 Próximos pasos:');
    console.log('   1. Revisa los cambios con git diff');
    console.log('   2. Prueba los endpoints principales');
    console.log('   3. Verifica que los logs funcionan en desarrollo');
    process.exit(0);
  }
}

main();

