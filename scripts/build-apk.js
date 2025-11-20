/**
 * Script para compilar APK directamente desde línea de comandos
 * No requiere abrir Android Studio
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('📦 Compilando APK para Android...\n');

// Verificar que existe la carpeta android
const androidDir = path.join(process.cwd(), 'android');
if (!fs.existsSync(androidDir)) {
  console.error('❌ Error: No se encontró la carpeta android');
  console.error('💡 Ejecuta primero: npx cap add android');
  process.exit(1);
}

// Verificar que existe gradlew
const gradlew = process.platform === 'win32' 
  ? path.join(androidDir, 'gradlew.bat')
  : path.join(androidDir, 'gradlew');

if (!fs.existsSync(gradlew)) {
  console.error('❌ Error: No se encontró gradlew');
  console.error('💡 Asegúrate de que el proyecto Android esté correctamente configurado');
  process.exit(1);
}

// Establecer JAVA_HOME ANTES de cambiar de directorio
// Buscar la versión más reciente de Java 17 instalada
const possiblePaths = [
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.17.10-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot',
  'C:\\Program Files\\Java\\jdk-17',
];

let javaHome = null;

// Buscar la primera versión válida (prioridad a la más reciente)
for (const possiblePath of possiblePaths) {
  if (fs.existsSync(possiblePath)) {
    // Verificar que tenga los archivos necesarios (bin/java.exe)
    const javaExe = path.join(possiblePath, 'bin', 'java.exe');
    if (fs.existsSync(javaExe)) {
      javaHome = possiblePath;
      break;
    }
  }
}

if (!javaHome) {
  // Fallback: usar JAVA_HOME del sistema si existe y es válido
  javaHome = process.env.JAVA_HOME;
  if (javaHome && fs.existsSync(javaHome)) {
    const javaExe = path.join(javaHome, 'bin', 'java.exe');
    if (!fs.existsSync(javaExe)) {
      console.error('❌ Error: JAVA_HOME configurado pero no es válido');
      process.exit(1);
    }
  } else {
    console.error('❌ Error: No se encontró Java 17 instalado');
    console.error('💡 Instala Java 17 desde: https://adoptium.net/temurin/releases/');
    process.exit(1);
  }
}

// Establecer JAVA_HOME en el proceso actual ANTES de cambiar de directorio
process.env.JAVA_HOME = javaHome;
console.log(`🔧 JAVA_HOME configurado: ${javaHome}`);

// Actualizar local.properties con org.gradle.java.home
const localPropertiesPath = path.join(androidDir, 'local.properties');
let localProperties = '';
if (fs.existsSync(localPropertiesPath)) {
  localProperties = fs.readFileSync(localPropertiesPath, 'utf8');
}

// Agregar o actualizar org.gradle.java.home
// Usar barras normales (/) que funcionan en Windows también
const javaHomePath = javaHome.replace(/\\/g, '/');
if (localProperties.includes('org.gradle.java.home')) {
  localProperties = localProperties.replace(
    /org\.gradle\.java\.home=.*/g,
    `org.gradle.java.home=${javaHomePath}`
  );
} else {
  localProperties += `\norg.gradle.java.home=${javaHomePath}\n`;
}

fs.writeFileSync(localPropertiesPath, localProperties, 'utf8');
console.log(`📝 Actualizado local.properties con org.gradle.java.home`);

try {
  // Cambiar al directorio android
  process.chdir(androidDir);
  
  // Configurar opciones de ejecución con JAVA_HOME
  const execOptions = {
    stdio: 'inherit',
    env: {
      ...process.env,
      JAVA_HOME: javaHome || process.env.JAVA_HOME
    }
  };
  
  console.log('🔨 Limpiando build anterior...');
  execSync(`${gradlew} clean`, execOptions);
  
  console.log('\n📱 Compilando APK de debug...');
  execSync(`${gradlew} assembleDebug`, execOptions);
  
  // Buscar el APK generado
  const apkPath = path.join(
    androidDir,
    'app',
    'build',
    'outputs',
    'apk',
    'debug',
    'app-debug.apk'
  );
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n✅ APK compilado exitosamente!');
    console.log(`📦 Ubicación: ${apkPath}`);
    console.log(`📊 Tamaño: ${sizeMB} MB`);
    console.log('\n💡 Puedes instalar este APK en tu dispositivo Android');
    console.log('   o compartirlo para testing.\n');
  } else {
    console.log('\n⚠️  APK compilado pero no se encontró en la ubicación esperada');
    console.log('💡 Busca en: android/app/build/outputs/apk/\n');
  }
  
} catch (error) {
  console.error('\n❌ Error al compilar APK:');
  console.error(error.message);
  process.exit(1);
}


