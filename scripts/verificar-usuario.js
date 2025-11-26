/**
 * Script para verificar usuario y sus tokens FCM
 * Uso: node scripts/verificar-usuario.js +591 76990076
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.error('Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificarUsuario(telefono) {
  console.log(`\n🔍 Buscando usuario con teléfono: ${telefono}\n`);
  
  // Normalizar teléfono (intentar diferentes formatos)
  const formatos = [
    telefono,
    telefono.startsWith('+') ? telefono : `+${telefono}`,
    telefono.startsWith('+') ? telefono.substring(1) : telefono,
    telefono.replace(/\s/g, ''), // Sin espacios
    telefono.replace(/\+/g, '').replace(/\s/g, ''), // Sin + ni espacios
  ];
  
  const formatosUnicos = [...new Set(formatos)];
  console.log('📱 Formatos a buscar:', formatosUnicos);
  
  let usuario = null;
  let formatoEncontrado = null;
  
  // Buscar usuario con diferentes formatos
  for (const formato of formatosUnicos) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', formato)
      .maybeSingle();
    
    if (data && !error) {
      usuario = data;
      formatoEncontrado = formato;
      console.log(`✅ Usuario encontrado con formato: ${formato}`);
      break;
    }
  }
  
  if (!usuario) {
    console.log('❌ Usuario no encontrado con ningún formato');
    console.log('\n💡 Intenta buscar manualmente en Supabase con estos formatos:');
    formatosUnicos.forEach(f => console.log(`   - ${f}`));
    return;
  }
  
  console.log('\n📋 INFORMACIÓN DEL USUARIO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:              ${usuario.id}`);
  console.log(`Nombre:          ${usuario.nombre || 'N/A'}`);
  console.log(`Teléfono:        ${usuario.telefono || 'N/A'}`);
  console.log(`Email:           ${usuario.correo || 'N/A'}`);
  console.log(`País:            ${usuario.pais || 'N/A'}`);
  console.log(`Suscripción:     ${usuario.suscripcion || 'N/A'}`);
  console.log(`Creado:          ${usuario.created_at || 'N/A'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Buscar tokens FCM
  console.log('\n🔑 BUSCANDO TOKENS FCM...\n');
  
  const { data: tokens, error: tokensError } = await supabase
    .from('fcm_tokens')
    .select('*')
    .eq('user_id', usuario.id)
    .order('created_at', { ascending: false });
  
  if (tokensError) {
    console.error('❌ Error obteniendo tokens:', tokensError);
    return;
  }
  
  if (!tokens || tokens.length === 0) {
    console.log('⚠️  El usuario NO tiene tokens FCM registrados');
    console.log('\n💡 Para activar tokens:');
    console.log('   1. El usuario debe iniciar sesión en la app');
    console.log('   2. El usuario debe dar permisos de notificaciones');
    console.log('   3. El sistema registrará el token automáticamente');
  } else {
    const tokensActivos = tokens.filter(t => t.is_active === true);
    const tokensInactivos = tokens.filter(t => t.is_active === false);
    
    console.log(`📊 RESUMEN DE TOKENS:`);
    console.log(`   Total:        ${tokens.length}`);
    console.log(`   Activos:      ${tokensActivos.length}`);
    console.log(`   Inactivos:    ${tokensInactivos.length}`);
    
    if (tokensActivos.length > 0) {
      console.log('\n✅ TOKENS ACTIVOS:');
      tokensActivos.forEach((token, index) => {
        const tokenPreview = token.token ? `${token.token.substring(0, 20)}...${token.token.substring(token.token.length - 10)}` : 'N/A';
        console.log(`\n   Token ${index + 1}:`);
        console.log(`   - ID:           ${token.id}`);
        console.log(`   - Token:         ${tokenPreview}`);
        console.log(`   - Dispositivo:   ${token.device_type || 'N/A'}`);
        console.log(`   - Modelo:        ${token.device_model || 'N/A'}`);
        console.log(`   - App Version:   ${token.app_version || 'N/A'}`);
        console.log(`   - Creado:        ${token.created_at || 'N/A'}`);
        console.log(`   - Último uso:    ${token.last_used_at || 'Nunca'}`);
      });
    }
    
    if (tokensInactivos.length > 0) {
      console.log('\n⚠️  TOKENS INACTIVOS:');
      tokensInactivos.forEach((token, index) => {
        const tokenPreview = token.token ? `${token.token.substring(0, 20)}...${token.token.substring(token.token.length - 10)}` : 'N/A';
        console.log(`\n   Token ${index + 1} (INACTIVO):`);
        console.log(`   - ID:           ${token.id}`);
        console.log(`   - Token:         ${tokenPreview}`);
        console.log(`   - Dispositivo:   ${token.device_type || 'N/A'}`);
        console.log(`   - Desactivado:   ${token.updated_at || 'N/A'}`);
      });
    }
  }
  
  // Buscar preferencias de notificaciones
  console.log('\n🔔 PREFERENCIAS DE NOTIFICACIONES:\n');
  
  const { data: prefs, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', usuario.id)
    .maybeSingle();
  
  if (prefsError && prefsError.code !== 'PGRST116') {
    console.error('❌ Error obteniendo preferencias:', prefsError);
  } else if (!prefs) {
    console.log('⚠️  El usuario NO tiene preferencias configuradas');
    console.log('   (Se usarán valores por defecto: todas habilitadas)');
  } else {
    console.log('📋 Preferencias actuales:');
    console.log(`   Push habilitado:        ${prefs.push_enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   Marketing habilitado:   ${prefs.marketing_enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   Recordatorios:          ${prefs.reminder_enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   Transacciones:          ${prefs.transaction_enabled ? '✅ Sí' : '❌ No'}`);
    console.log(`   Timezone:               ${prefs.timezone || 'N/A'}`);
    console.log(`   Horas silenciosas:      ${prefs.quiet_hours_start || 'N/A'} - ${prefs.quiet_hours_end || 'N/A'}`);
  }
  
  // Resumen final
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN FINAL:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const tokensActivosCount = tokens?.filter(t => t.is_active === true).length || 0;
  console.log(`Usuario encontrado:     ✅`);
  console.log(`Tokens activos:         ${tokensActivosCount > 0 ? `✅ ${tokensActivosCount}` : '❌ 0'}`);
  console.log(`Puede recibir notifs:   ${tokensActivosCount > 0 && (!prefs || prefs.push_enabled !== false) ? '✅ Sí' : '❌ No'}`);
  
  if (tokensActivosCount === 0) {
    console.log('\n⚠️  ACCIÓN REQUERIDA:');
    console.log('   El usuario necesita iniciar sesión y dar permisos de notificaciones');
    console.log('   para que se registre un token FCM activo.');
  }
  console.log('\n');
}

// Ejecutar
const telefono = process.argv[2];

if (!telefono) {
  console.error('❌ Error: Debes proporcionar un número de teléfono');
  console.error('Uso: node scripts/verificar-usuario.js "+591 76990076"');
  process.exit(1);
}

verificarUsuario(telefono).catch(error => {
  console.error('❌ Error ejecutando script:', error);
  process.exit(1);
});

