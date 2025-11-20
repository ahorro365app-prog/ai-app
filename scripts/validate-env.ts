/**
 * Script de validación de variables de entorno
 * 
 * Verifica que todas las variables de entorno requeridas estén configuradas
 * y que no haya secrets expuestos en el código
 * 
 * Uso: npx tsx scripts/validate-env.ts
 */

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  isSecret?: boolean;
}

// Variables de entorno requeridas para la app principal
const requiredEnvVars: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'URL de Supabase',
    isSecret: false,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Clave anónima de Supabase',
    isSecret: false, // Es pública, pero sensible
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Clave de servicio de Supabase (SECRETO)',
    isSecret: true,
  },
  {
    name: 'FIREBASE_PROJECT_ID',
    required: false,
    description: 'ID del proyecto de Firebase para notificaciones push',
  },
  {
    name: 'FIREBASE_CLIENT_EMAIL',
    required: false,
    description: 'Correo del service account de Firebase',
    isSecret: false,
  },
  {
    name: 'FIREBASE_PRIVATE_KEY',
    required: false,
    description: 'Private key del service account de Firebase',
    isSecret: true,
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_API_KEY',
    required: false,
    description: 'API Key pública de Firebase para la app web',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    required: false,
    description: 'Auth domain de Firebase',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    required: false,
    description: 'Project ID de Firebase (cliente web)',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    required: false,
    description: 'Storage bucket de Firebase',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    required: false,
    description: 'Sender ID de Firebase Cloud Messaging',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_APP_ID',
    required: false,
    description: 'App ID de Firebase',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    required: false,
    description: 'Measurement ID de Firebase (Analytics)',
  },
  {
    name: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY',
    required: false,
    description: 'VAPID key para notificaciones web push',
  },
  {
    name: 'NEXT_PUBLIC_GROQ_API_KEY',
    required: false,
    description: 'API Key de Groq',
    isSecret: true,
  },
  {
    name: 'META_WHATSAPP_TOKEN',
    required: false,
    description: 'Token de WhatsApp Meta',
    isSecret: true,
  },
  {
    name: 'WEBHOOK_VERIFY_TOKEN',
    required: false,
    description: 'Token de verificación de webhook',
    isSecret: true,
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'URL de Upstash Redis',
    isSecret: false,
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Token de Upstash Redis',
    isSecret: true,
  },
];

// Variables de entorno requeridas para admin dashboard
const adminEnvVars: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'URL de Supabase',
    isSecret: false,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Clave de servicio de Supabase (SECRETO)',
    isSecret: true,
  },
  {
    name: 'FIREBASE_PROJECT_ID',
    required: false,
    description: 'ID del proyecto de Firebase para notificaciones push',
  },
  {
    name: 'FIREBASE_CLIENT_EMAIL',
    required: false,
    description: 'Correo del service account de Firebase',
    isSecret: false,
  },
  {
    name: 'FIREBASE_PRIVATE_KEY',
    required: false,
    description: 'Private key del service account de Firebase',
    isSecret: true,
  },
  {
    name: 'JWT_SECRET',
    required: false,
    description: 'Secret para JWT',
    isSecret: true,
  },
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    description: 'URL de Upstash Redis',
    isSecret: false,
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    description: 'Token de Upstash Redis',
    isSecret: true,
  },
];

function validateEnvVars(envVars: EnvVar[], prefix: string = ''): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const envVar of envVars) {
    const value = process.env[envVar.name];

    if (!value) {
      if (envVar.required) {
        missing.push(envVar.name);
      } else {
        warnings.push(`⚠️ ${envVar.name} no configurada (opcional)`);
      }
    } else {
      // Validar que no sea un valor placeholder
      if (
        value.includes('your_') ||
        value.includes('PLACEHOLDER') ||
        value.includes('example') ||
        value.includes('demo-secret') ||
        value === 'changeme'
      ) {
        warnings.push(`⚠️ ${envVar.name} tiene un valor placeholder`);
      }

      // Validar que secrets no sean demasiado cortos
      if (envVar.isSecret && value.length < 16) {
        warnings.push(`⚠️ ${envVar.name} parece ser demasiado corta para un secret`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

function checkGitIgnore(): boolean {
  const fs = require('fs');
  const path = require('path');

  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.error('❌ .gitignore no encontrado');
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  
  // Verificar que .env* esté en .gitignore
  if (!gitignoreContent.includes('.env')) {
    console.error('❌ .gitignore no incluye .env*');
    return false;
  }

  return true;
}

function checkForHardcodedSecrets(): string[] {
  // Esta función debería ejecutarse con herramientas externas como:
  // - git-secrets
  // - truffleHog
  // - gitleaks
  
  // Por ahora, solo retornamos una advertencia
  return [
    '⚠️ Ejecuta herramientas como gitleaks o truffleHog para buscar secrets hardcodeados',
  ];
}

async function main() {
  console.log('🔍 VALIDACIÓN DE VARIABLES DE ENTORNO');
  console.log('='.repeat(50));
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('');

  // 1. Verificar .gitignore
  console.log('📋 1. Verificando .gitignore...');
  const gitignoreValid = checkGitIgnore();
  if (gitignoreValid) {
    console.log('✅ .gitignore correctamente configurado');
  } else {
    console.error('❌ .gitignore necesita corrección');
  }
  console.log('');

  // 2. Validar variables de entorno de app principal
  console.log('📋 2. Validando variables de entorno (App Principal)...');
  const appValidation = validateEnvVars(requiredEnvVars, 'App');
  
  if (appValidation.valid) {
    console.log('✅ Todas las variables requeridas están configuradas');
  } else {
    console.error('❌ Variables faltantes:');
    appValidation.missing.forEach(name => {
      console.error(`   - ${name}`);
    });
  }

  if (appValidation.warnings.length > 0) {
    console.log('');
    console.log('⚠️ Advertencias:');
    appValidation.warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });
  }
  console.log('');

  // 3. Validar variables de entorno de admin dashboard
  console.log('📋 3. Validando variables de entorno (Admin Dashboard)...');
  const adminValidation = validateEnvVars(adminEnvVars, 'Admin');
  
  if (adminValidation.valid) {
    console.log('✅ Todas las variables requeridas están configuradas');
  } else {
    console.error('❌ Variables faltantes:');
    adminValidation.missing.forEach(name => {
      console.error(`   - ${name}`);
    });
  }

  if (adminValidation.warnings.length > 0) {
    console.log('');
    console.log('⚠️ Advertencias:');
    adminValidation.warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });
  }
  console.log('');

  // 4. Advertencia sobre secrets hardcodeados
  console.log('📋 4. Verificando secrets hardcodeados...');
  const hardcodedWarnings = checkForHardcodedSecrets();
  hardcodedWarnings.forEach(warning => {
    console.log(`   ${warning}`);
  });
  console.log('');

  // Resumen
  console.log('='.repeat(50));
  console.log('📊 RESUMEN');
  console.log('='.repeat(50));
  
  const allValid = gitignoreValid && appValidation.valid && adminValidation.valid;
  
  if (allValid) {
    console.log('✅ Todas las validaciones pasaron');
    process.exit(0);
  } else {
    console.error('❌ Algunas validaciones fallaron');
    console.error('');
    console.error('🔧 ACCIONES REQUERIDAS:');
    if (!gitignoreValid) {
      console.error('   1. Asegúrate de que .gitignore incluya .env*');
    }
    if (!appValidation.valid) {
      console.error('   2. Configura las variables de entorno faltantes en .env.local');
    }
    if (!adminValidation.valid) {
      console.error('   3. Configura las variables de entorno faltantes en admin-dashboard/.env.local');
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('💥 Error ejecutando validación:', error);
  process.exit(1);
});

