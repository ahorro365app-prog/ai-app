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
// PRIMERO: Intentar leer desde local.properties (más confiable)
let javaHome = null;
let java21Found = false;

const localPropertiesPath = path.join(androidDir, 'local.properties');
if (fs.existsSync(localPropertiesPath)) {
  const localProperties = fs.readFileSync(localPropertiesPath, 'utf8');
  const javaHomeMatch = localProperties.match(/org\.gradle\.java\.home=(.+)/);
  if (javaHomeMatch && javaHomeMatch[1]) {
    // Convertir barras normales a barras invertidas para Windows
    let javaHomeFromProps = javaHomeMatch[1].trim();
    // Normalizar la ruta (manejar tanto / como \)
    javaHomeFromProps = path.normalize(javaHomeFromProps);
    
    if (fs.existsSync(javaHomeFromProps)) {
      const javaExe = path.join(javaHomeFromProps, 'bin', 'java.exe');
      if (fs.existsSync(javaExe)) {
        try {
          // java -version escribe a stderr, redirigir a stdout con 2>&1
          const versionOutput = execSync(`"${javaExe}" -version 2>&1`, { 
            encoding: 'utf8',
            stdio: 'pipe'
          });
          // Verificar versión 21 (más flexible)
          if (versionOutput.includes('version "21') || 
              versionOutput.includes('21.') || 
              versionOutput.includes('openjdk version "21') ||
              /version "21[.\d]+/.test(versionOutput) ||
              /21\./.test(versionOutput)) {
            javaHome = javaHomeFromProps;
            java21Found = true;
            console.log(`✅ Java 21 encontrado en local.properties: ${javaHomeFromProps}`);
          } else {
            console.log(`⚠️  Java encontrado en local.properties pero no es versión 21`);
            console.log(`   Salida: ${versionOutput.substring(0, 150)}`);
          }
        } catch (e) {
          console.log(`⚠️  Error verificando versión de Java: ${e.message}`);
          // Continuar buscando en otras rutas
        }
      } else {
        console.log(`⚠️  java.exe no encontrado en: ${javaExe}`);
      }
    } else {
      console.log(`⚠️  Ruta de Java en local.properties no existe: ${javaHomeFromProps}`);
    }
  }
}

// Si no se encontró en local.properties, buscar en rutas comunes
if (!java21Found) {
  // Buscar Java 21 primero (requerido por @capacitor/push-notifications), luego Java 17
  const possiblePaths = [
  // Java 21 (prioridad - requerido por push-notifications)
  'C:\\Program Files\\Android\\Android Studio\\jbr', // Android Studio incluye Java 21 (PRIMERA PRIORIDAD)
  'C:\\Program Files (x86)\\Android\\Android Studio\\jbr',
  path.join(process.env.LOCALAPPDATA || '', 'Android', 'Android Studio', 'jbr'),
  // Eclipse Adoptium Java 21 (versiones específicas)
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.9.10-hotspot', // Versión instalada por el usuario
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.9-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0',
  'C:\\Program Files\\Java\\jdk-21',
  // Java 17 (fallback)
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.17.10-hotspot',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.16.8-hotspot',
  'C:\\Program Files\\Java\\jdk-17',
];

  for (let i = 0; i < 9; i++) { // Primeras 9 rutas son Java 21
    const possiblePath = possiblePaths[i];
    if (fs.existsSync(possiblePath)) {
      const javaExe = path.join(possiblePath, 'bin', 'java.exe');
      if (fs.existsSync(javaExe)) {
        // Verificar que sea Java 21
      try {
        const versionOutput = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf8', stdio: 'pipe' });
        if (versionOutput.includes('version "21') || versionOutput.includes('21.') || /21\./.test(versionOutput)) {
            javaHome = possiblePath;
            java21Found = true;
            console.log(`✅ Java 21 encontrado: ${possiblePath}`);
            break;
          }
        } catch (e) {
          // Continuar buscando
        }
      }
    }
  }

  // Si no se encontró Java 21, buscar Java 17 como fallback
  if (!java21Found) {
    for (let i = 9; i < possiblePaths.length; i++) {
      const possiblePath = possiblePaths[i];
      if (fs.existsSync(possiblePath)) {
        const javaExe = path.join(possiblePath, 'bin', 'java.exe');
        if (fs.existsSync(javaExe)) {
          javaHome = possiblePath;
          break;
        }
      }
    }
  }
}

// Si aún no se encontró, intentar con JAVA_HOME del sistema
if (!javaHome) {
  // Fallback: usar JAVA_HOME del sistema si existe y es válido
  javaHome = process.env.JAVA_HOME;
  if (javaHome && fs.existsSync(javaHome)) {
    const javaExe = path.join(javaHome, 'bin', 'java.exe');
    if (!fs.existsSync(javaExe)) {
      console.error('❌ Error: JAVA_HOME configurado pero no es válido');
      process.exit(1);
    }
    // Verificar versión
    try {
      const versionOutput = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf8', stdio: 'pipe' });
      if (!versionOutput.includes('version "21') && !versionOutput.includes('21.') && !/21\./.test(versionOutput)) {
        console.error('❌ Error: JAVA_HOME apunta a Java que no es versión 21');
        console.error('💡 El plugin @capacitor/push-notifications requiere Java 21');
        console.error('💡 Instala Java 21 desde: https://adoptium.net/temurin/releases/?version=21');
        process.exit(1);
      }
      java21Found = true;
    } catch (e) {
      console.error('❌ Error: No se pudo verificar la versión de Java');
      process.exit(1);
    }
  } else {
    console.error('❌ Error: No se encontró Java 21 instalado');
    console.error('💡 El plugin @capacitor/push-notifications requiere Java 21');
    console.error('💡 Instala Java 21 desde: https://adoptium.net/temurin/releases/?version=21');
    console.error('💡 O instala Android Studio que incluye Java 21 (JBR)');
    process.exit(1);
  }
}

// Verificar que tenemos Java 21 (no Java 17)
if (!java21Found && javaHome) {
  try {
    const javaExe = path.join(javaHome, 'bin', 'java.exe');
    const versionOutput = execSync(`"${javaExe}" -version 2>&1`, { encoding: 'utf8', stdio: 'pipe' });
    if (!versionOutput.includes('version "21') && !versionOutput.includes('21.') && !/21\./.test(versionOutput)) {
      console.error('\n❌ Error: Se encontró Java pero NO es versión 21');
      console.error(`💡 Versión encontrada: ${versionOutput.split('\n')[0]}`);
      console.error('💡 El plugin @capacitor/push-notifications requiere Java 21');
      console.error('💡 Instala Java 21 desde: https://adoptium.net/temurin/releases/?version=21');
      console.error('💡 O instala Android Studio que incluye Java 21 (JBR)');
      process.exit(1);
    }
  } catch (e) {
    // Si no podemos verificar, continuar (pero puede fallar después)
  }
}

// Establecer JAVA_HOME en el proceso actual ANTES de cambiar de directorio
process.env.JAVA_HOME = javaHome;
console.log(`🔧 JAVA_HOME configurado: ${javaHome}`);

// Actualizar local.properties con org.gradle.java.home
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


