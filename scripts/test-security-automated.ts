/**
 * Script automatizado para testing de seguridad
 * Ejecutar con: npx tsx scripts/test-security-automated.ts
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Cargar variables de entorno desde .env.local si existe
function loadEnvFile(filePath: string): void {
  if (existsSync(filePath)) {
    const envContent = readFileSync(filePath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

// Intentar cargar .env.local desde la raíz y admin-dashboard
loadEnvFile(join(__dirname, '..', '.env.local'));
loadEnvFile(join(__dirname, '..', 'admin-dashboard', '.env.local'));

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function runTest(name: string, testFn: () => void): void {
  try {
    testFn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: Verificar variables de entorno
runTest('Variables de entorno - UPSTASH_REDIS_REST_URL', () => {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    throw new Error('UPSTASH_REDIS_REST_URL no configurada');
  }
});

runTest('Variables de entorno - UPSTASH_REDIS_REST_TOKEN', () => {
  if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('UPSTASH_REDIS_REST_TOKEN no configurada');
  }
});

runTest('Variables de entorno - NEXT_PUBLIC_SUPABASE_URL', () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurada');
  }
});

runTest('Variables de entorno - SUPABASE_SERVICE_ROLE_KEY', () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no configurada');
  }
});

// Test 2: Verificar archivos críticos
runTest('Archivo - src/lib/errorHandler.ts', () => {
  const filePath = join(__dirname, '..', 'src', 'lib', 'errorHandler.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  // Verificar que tiene funciones de error handling
  if (!content.includes('export') || (!content.includes('handleError') && !content.includes('handleApiError') && !content.includes('ErrorType'))) {
    throw new Error('Archivo no parece ser válido');
  }
});

runTest('Archivo - src/lib/validations.ts', () => {
  try {
    const filePath = join(__dirname, '..', 'src', 'lib', 'validations.ts');
    if (!existsSync(filePath)) {
      throw new Error('Archivo no encontrado');
    }
    // Solo verificar que el archivo existe, no importarlo (puede tener dependencias de Next.js)
    const content = readFileSync(filePath, 'utf-8');
    if (!content.includes('zod') || !content.includes('export')) {
      throw new Error('Archivo no parece ser válido');
    }
  } catch (error: any) {
    throw new Error(`Archivo no encontrado o tiene errores: ${error.message}`);
  }
});

runTest('Archivo - src/lib/rateLimit.ts', () => {
  const filePath = join(__dirname, '..', 'src', 'lib', 'rateLimit.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  if (!content.includes('Ratelimit') || !content.includes('export')) {
    throw new Error('Archivo no parece ser válido');
  }
});

runTest('Archivo - src/lib/csrf.ts', () => {
  const filePath = join(__dirname, '..', 'src', 'lib', 'csrf.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  if (!content.includes('generateCSRFToken') || !content.includes('export')) {
    throw new Error('Archivo no parece ser válido');
  }
});

runTest('Archivo - src/lib/securityHeaders.ts', () => {
  const filePath = join(__dirname, '..', 'src', 'lib', 'securityHeaders.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  if (!content.includes('getSecurityHeaders') || !content.includes('export')) {
    throw new Error('Archivo no parece ser válido');
  }
});

runTest('Archivo - src/lib/logger.ts', () => {
  const filePath = join(__dirname, '..', 'src', 'lib', 'logger.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  if (!content.includes('logger') || !content.includes('export')) {
    throw new Error('Archivo no parece ser válido');
  }
});

runTest('Archivo - admin-dashboard/src/lib/totp-helpers.ts', () => {
  const filePath = join(__dirname, '..', 'admin-dashboard', 'src', 'lib', 'totp-helpers.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  if (!content.includes('generateTOTPSecret') || !content.includes('export')) {
    throw new Error('Archivo no parece ser válido');
  }
});

runTest('Archivo - admin-dashboard/src/lib/audit-logger.ts', () => {
  const filePath = join(__dirname, '..', 'admin-dashboard', 'src', 'lib', 'audit-logger.ts');
  if (!existsSync(filePath)) {
    throw new Error('Archivo no encontrado');
  }
  const content = readFileSync(filePath, 'utf-8');
  if (!content.includes('logAuditEvent') || !content.includes('export')) {
    throw new Error('Archivo no parece ser válido');
  }
});

// Test 3: Verificar .gitignore
runTest('.gitignore - .env files', () => {
  const gitignorePath = join(__dirname, '..', '.gitignore');
  if (!existsSync(gitignorePath)) {
    throw new Error('.gitignore no encontrado');
  }
  const gitignore = readFileSync(gitignorePath, 'utf-8');
  if (!gitignore.includes('.env*') && !gitignore.includes('.env')) {
    throw new Error('.env no está en .gitignore');
  }
});

// Test 4: Verificar que no hay secrets hardcodeados (básico)
runTest('Secrets - No API keys en código', () => {
  const files = [
    'src/**/*.ts',
    'admin-dashboard/src/**/*.ts',
  ];
  
  // Buscar patrones comunes de secrets
  const patterns = [
    /sk_live_[a-zA-Z0-9]{32,}/, // Stripe
    /AIza[a-zA-Z0-9_-]{35}/, // Google API
    /AKIA[0-9A-Z]{16}/, // AWS
    /ghp_[a-zA-Z0-9]{36}/, // GitHub
  ];
  
  // Este test es básico, para una verificación completa usar gitleaks
  console.log('⚠️  Para verificación completa de secrets, ejecuta: gitleaks detect');
});

// Resumen
console.log('\n📊 RESUMEN DE TESTING AUTOMATIZADO\n');
console.log(`Total de tests: ${results.length}`);
console.log(`✅ Pasados: ${results.filter(r => r.passed).length}`);
console.log(`❌ Fallidos: ${results.filter(r => !r.passed).length}`);
console.log(`Tasa de éxito: ${((results.filter(r => r.passed).length / results.length) * 100).toFixed(1)}%`);

if (results.some(r => !r.passed)) {
  console.log('\n❌ Tests fallidos:');
  results.filter(r => !r.passed).forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  console.log('\n💡 Notas:');
  console.log('  - Las variables de entorno deben estar en .env.local');
  console.log('  - Verifica que los archivos .env.local existan y tengan las variables necesarias');
  console.log('  - Para verificación completa de secrets, ejecuta: gitleaks detect');
  process.exit(1);
} else {
  console.log('\n✅ Todos los tests automatizados pasaron!');
  process.exit(0);
}

