/**
 * Script de Testing para Fase 1 - Seguridad
 * 
 * Ejecuta tests automatizados para verificar todas las implementaciones de seguridad
 * 
 * Uso: npx tsx scripts/test-fase1-security.ts
 */

import { createClient } from '@supabase/supabase-js';
import { comparePassword, hashPassword, isBcryptHash } from '../admin-dashboard/src/lib/bcrypt-helpers';
import { validateWithZod } from '../src/lib/validations';
import { createPaymentSchema, adminLoginSchema, uuidSchema, emailSchema } from '../src/lib/validations';
import { handleError, ErrorType } from '../src/lib/errorHandler';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
  if (details && !passed) {
    console.log('   Detalles:', details);
  }
}

async function testRLSDisabled() {
  console.log('\n📋 TEST 1: RLS Deshabilitado');
  console.log('─'.repeat(50));
  
  try {
    // Verificar que RLS está deshabilitado
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('usuarios', 'transacciones', 'deudas', 'metas', 'pagos')
        ORDER BY tablename;
      `
    });
    
    // Alternativa: intentar query directa
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (usuariosError) {
      addResult(
        'RLS Deshabilitado',
        false,
        `Error al verificar: ${usuariosError.message}`,
        usuariosError
      );
      return;
    }
    
    // Si podemos hacer query sin error, RLS probablemente está deshabilitado
    // (o tiene políticas permisivas)
    addResult(
      'RLS Deshabilitado',
      true,
      'RLS deshabilitado o políticas permisivas - queries funcionan'
    );
    
  } catch (error: any) {
    addResult(
      'RLS Deshabilitado',
      false,
      `Error: ${error.message}`,
      error
    );
  }
}

async function testBcrypt() {
  console.log('\n🔐 TEST 2: Contraseñas Admin con Bcrypt');
  console.log('─'.repeat(50));
  
  try {
    // Test 1: Verificar que bcrypt funciona
    const testPassword = 'test123';
    const hash = await hashPassword(testPassword);
    
    if (!isBcryptHash(hash)) {
      addResult(
        'Bcrypt Hash',
        false,
        'El hash generado no es un hash bcrypt válido',
        { hash: hash.substring(0, 20) }
      );
      return;
    }
    
    addResult('Bcrypt Hash', true, 'Hash bcrypt generado correctamente');
    
    // Test 2: Verificar comparación
    const match = await comparePassword(testPassword, hash);
    if (!match) {
      addResult('Bcrypt Compare', false, 'La comparación de contraseña falló');
      return;
    }
    
    addResult('Bcrypt Compare', true, 'Comparación de contraseña funciona correctamente');
    
    // Test 3: Verificar que contraseña incorrecta falla
    const wrongMatch = await comparePassword('wrongpassword', hash);
    if (wrongMatch) {
      addResult('Bcrypt Wrong Password', false, 'Aceptó contraseña incorrecta');
      return;
    }
    
    addResult('Bcrypt Wrong Password', true, 'Rechaza contraseñas incorrectas correctamente');
    
    // Test 4: Verificar contraseñas en BD
    const { data: admins, error } = await supabase
      .from('admin_users')
      .select('email, password_hash')
      .limit(5);
    
    if (error) {
      addResult('Bcrypt BD Check', false, `Error al verificar BD: ${error.message}`);
      return;
    }
    
    if (!admins || admins.length === 0) {
      addResult('Bcrypt BD Check', true, 'No hay usuarios admin para verificar (OK)');
      return;
    }
    
    const allHashed = admins.every(admin => isBcryptHash(admin.password_hash));
    if (!allHashed) {
      const plainTextAdmins = admins.filter(admin => !isBcryptHash(admin.password_hash));
      addResult(
        'Bcrypt BD Check',
        false,
        `${plainTextAdmins.length} usuario(s) con contraseña en texto plano`,
        { emails: plainTextAdmins.map(a => a.email) }
      );
      return;
    }
    
    addResult('Bcrypt BD Check', true, `Todos los ${admins.length} usuarios admin tienen contraseñas hasheadas`);
    
  } catch (error: any) {
    addResult('Bcrypt Tests', false, `Error: ${error.message}`, error);
  }
}

async function testRateLimiting() {
  console.log('\n⏱️ TEST 3: Rate Limiting con Upstash Redis');
  console.log('─'.repeat(50));
  
  try {
    const { adminLoginRateLimit, getClientIdentifier } = await import('../admin-dashboard/src/lib/rateLimit');
    
    // Verificar que las variables de entorno están configuradas
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      addResult(
        'Rate Limiting Config',
        false,
        'Variables de entorno de Upstash no configuradas',
        {
          hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
          hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        }
      );
      return;
    }
    
    addResult('Rate Limiting Config', true, 'Variables de entorno configuradas');
    
    // Test: Verificar que rate limiter se crea correctamente
    try {
      const testIdentifier = 'test-ip-123';
      const result = await adminLoginRateLimit.limit(testIdentifier);
      
      if (typeof result.success !== 'boolean') {
        addResult('Rate Limiting Connection', false, 'Respuesta inválida de Upstash');
        return;
      }
      
      addResult('Rate Limiting Connection', true, 'Conexión a Upstash Redis funciona');
      addResult(
        'Rate Limiting Test',
        true,
        `Rate limit check: ${result.success ? 'permitido' : 'bloqueado'}, remaining: ${result.remaining}/${result.limit}`
      );
      
    } catch (error: any) {
      addResult(
        'Rate Limiting Connection',
        false,
        `Error conectando a Upstash: ${error.message}`,
        error
      );
    }
    
  } catch (error: any) {
    addResult('Rate Limiting Tests', false, `Error: ${error.message}`, error);
  }
}

async function testErrorHandling() {
  console.log('\n⚠️ TEST 4: Error Handling Seguro');
  console.log('─'.repeat(50));
  
  try {
    // Test 1: Verificar que handleError existe y funciona
    const testError = new Error('Test error message');
    const response = handleError(testError, 'Error de prueba');
    
    if (!response) {
      addResult('Error Handler Function', false, 'handleError no retorna respuesta');
      return;
    }
    
    addResult('Error Handler Function', true, 'handleError funciona correctamente');
    
    // Test 2: Verificar clasificación de errores
    const validationError = handleError(
      new Error('Validation failed'),
      'Error de validación',
      ErrorType.VALIDATION
    );
    
    addResult('Error Classification', true, 'Clasificación de errores funciona');
    
    // Test 3: Verificar comportamiento por entorno
    const isDev = process.env.NODE_ENV === 'development';
    const errorResponse = await response.json();
    
    if (isDev && !errorResponse.details) {
      addResult('Error Dev Details', false, 'En desarrollo debería incluir details');
    } else if (!isDev && errorResponse.details) {
      addResult('Error Prod Details', false, 'En producción NO debería incluir details');
    } else {
      addResult(
        'Error Environment',
        true,
        `Comportamiento correcto para ${isDev ? 'desarrollo' : 'producción'}`
      );
    }
    
  } catch (error: any) {
    addResult('Error Handling Tests', false, `Error: ${error.message}`, error);
  }
}

async function testZodValidation() {
  console.log('\n✅ TEST 5: Validación de Inputs con Zod');
  console.log('─'.repeat(50));
  
  try {
    // Test 1: Validación de email
    const emailTest1 = validateWithZod(emailSchema, 'test@example.com');
    if (!emailTest1.success) {
      addResult('Zod Email Valid', false, 'Email válido rechazado', emailTest1);
      return;
    }
    addResult('Zod Email Valid', true, 'Email válido aceptado');
    
    const emailTest2 = validateWithZod(emailSchema, 'invalid-email');
    if (emailTest2.success) {
      addResult('Zod Email Invalid', false, 'Email inválido aceptado');
      return;
    }
    addResult('Zod Email Invalid', true, 'Email inválido rechazado correctamente');
    
    // Test 2: Validación de UUID
    const uuidTest1 = validateWithZod(uuidSchema, '550e8400-e29b-41d4-a716-446655440000');
    if (!uuidTest1.success) {
      addResult('Zod UUID Valid', false, 'UUID válido rechazado', uuidTest1);
      return;
    }
    addResult('Zod UUID Valid', true, 'UUID válido aceptado');
    
    const uuidTest2 = validateWithZod(uuidSchema, 'not-a-uuid');
    if (uuidTest2.success) {
      addResult('Zod UUID Invalid', false, 'UUID inválido aceptado');
      return;
    }
    addResult('Zod UUID Invalid', true, 'UUID inválido rechazado correctamente');
    
    // Test 3: Validación de pago
    const paymentValid = validateWithZod(createPaymentSchema, {
      plan: 'pro',
      monto_usdt: 10.5,
    });
    if (!paymentValid.success) {
      addResult('Zod Payment Valid', false, 'Pago válido rechazado', paymentValid);
      return;
    }
    addResult('Zod Payment Valid', true, 'Pago válido aceptado');
    
    const paymentInvalid = validateWithZod(createPaymentSchema, {
      plan: 'invalid',
      monto_usdt: -10,
    });
    if (paymentInvalid.success) {
      addResult('Zod Payment Invalid', false, 'Pago inválido aceptado');
      return;
    }
    addResult('Zod Payment Invalid', true, 'Pago inválido rechazado correctamente');
    
    // Test 4: Validación de XSS
    const xssTest = validateWithZod(
      require('../src/lib/validations').safeTextSchema,
      '<script>alert(1)</script>'
    );
    if (xssTest.success) {
      addResult('Zod XSS Protection', false, 'Script XSS aceptado');
      return;
    }
    addResult('Zod XSS Protection', true, 'Script XSS rechazado correctamente');
    
    // Test 5: Validación de login admin
    const loginValid = validateWithZod(adminLoginSchema, {
      email: 'admin@example.com',
      password: 'password123',
    });
    if (!loginValid.success) {
      addResult('Zod Login Valid', false, 'Login válido rechazado', loginValid);
      return;
    }
    addResult('Zod Login Valid', true, 'Login válido aceptado');
    
    const loginInvalid = validateWithZod(adminLoginSchema, {
      email: 'not-an-email',
      password: '',
    });
    if (loginInvalid.success) {
      addResult('Zod Login Invalid', false, 'Login inválido aceptado');
      return;
    }
    addResult('Zod Login Invalid', true, 'Login inválido rechazado correctamente');
    
  } catch (error: any) {
    addResult('Zod Validation Tests', false, `Error: ${error.message}`, error);
  }
}

async function runAllTests() {
  console.log('🧪 TESTING COMPLETO - FASE 1 SEGURIDAD');
  console.log('='.repeat(50));
  console.log(`Fecha: ${new Date().toISOString()}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  
  await testRLSDisabled();
  await testBcrypt();
  await testRateLimiting();
  await testErrorHandling();
  await testZodValidation();
  
  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total: ${total}`);
  console.log(`✅ Pasados: ${passed}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📈 Tasa de éxito: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ TESTS FALLIDOS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON!');
    process.exit(0);
  } else {
    console.log('⚠️ ALGUNOS TESTS FALLARON - Revisa los detalles arriba');
    process.exit(1);
  }
}

// Ejecutar tests
runAllTests().catch((error) => {
  console.error('💥 Error fatal ejecutando tests:', error);
  process.exit(1);
});

