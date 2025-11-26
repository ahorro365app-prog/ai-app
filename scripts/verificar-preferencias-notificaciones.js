const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Las variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyNotificationPreferences(userId) {
  console.log(`\n🔍 Verificando preferencias de notificaciones para usuario: ${userId}\n`);

  const { data: preferences, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error obteniendo preferencias:', error);
    return;
  }

  if (!preferences) {
    console.log('⚠️  No se encontraron preferencias para este usuario.');
    console.log('   Esto significa que se usarán los valores por defecto:');
    console.log('   - push_enabled: true');
    console.log('   - transaction_enabled: true');
    console.log('   - reminder_enabled: true');
    console.log('   - marketing_enabled: true\n');
    return;
  }

  console.log('📋 PREFERENCIAS DE NOTIFICACIONES:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`ID:                    ${preferences.id}`);
  console.log(`User ID:               ${preferences.user_id}`);
  console.log(`Push habilitado:       ${preferences.push_enabled ? '✅ true' : '❌ false'}`);
  console.log(`Marketing habilitado:  ${preferences.marketing_enabled ? '✅ true' : '❌ false'}`);
  console.log(`Recordatorios:         ${preferences.reminder_enabled ? '✅ true' : '❌ false'}`);
  console.log(`Transacciones:         ${preferences.transaction_enabled ? '✅ true' : '❌ false'}`);
  console.log(`Timezone:              ${preferences.timezone || 'N/A'}`);
  console.log(`Creado:                ${preferences.created_at || 'N/A'}`);
  console.log(`Actualizado:           ${preferences.updated_at || 'N/A'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Verificar si hay valores false
  const disabledPreferences = [];
  if (preferences.push_enabled === false) disabledPreferences.push('push_enabled');
  if (preferences.marketing_enabled === false) disabledPreferences.push('marketing_enabled');
  if (preferences.reminder_enabled === false) disabledPreferences.push('reminder_enabled');
  if (preferences.transaction_enabled === false) disabledPreferences.push('transaction_enabled');

  if (disabledPreferences.length > 0) {
    console.log('⚠️  PREFERENCIAS DESACTIVADAS:');
    disabledPreferences.forEach(pref => {
      console.log(`   - ${pref}: false`);
    });
    console.log('');
  } else {
    console.log('✅ Todas las preferencias están activadas (true)\n');
  }
}

const userId = process.argv[2];
if (!userId) {
  console.error('Uso: node verificar-preferencias-notificaciones.js "<user_id>"');
  console.error('Ejemplo: node verificar-preferencias-notificaciones.js "d70c685f-b22f-4aa2-90d3-494e594cd043"');
  process.exit(1);
}

verifyNotificationPreferences(userId);

