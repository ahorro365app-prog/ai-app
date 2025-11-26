import { logger } from './logger';

/**
 * Calcula accuracy ponderado por país
 * Solo cuenta: whatsapp_reaction (1.0) + app_edit (2.0)
 * NO cuenta: timeout (0.0)
 */
export async function calculateWeightedAccuracy(
  supabase: any,
  country_code: string
) {
  logger.debug(`📊 Calculando accuracy ponderado para: ${country_code}`);

  // Obtener SOLO feedback verificado
  const { data: feedback, error } = await supabase
    .from('feedback_usuarios')
    .select('era_correcto, confiabilidad')
    .eq('country_code', country_code)
    .in('origen', ['whatsapp_reaction', 'app_edit']);

  if (error) {
    logger.error('❌ Error obteniendo feedback:', error);
    return {
      accuracy: 0,
      verified_count: 0,
      correct_weighted: 0,
      total_weighted: 0
    };
  }

  if (!feedback || feedback.length === 0) {
    logger.debug(`⚠️ Sin feedback verificado para ${country_code}`);
    return {
      accuracy: 0,
      verified_count: 0,
      correct_weighted: 0,
      total_weighted: 0
    };
  }

  // Calcular ponderado
  let correctWeighted = 0;
  let totalWeight = 0;

  for (const fb of feedback) {
    totalWeight += fb.confiabilidad;
    if (fb.era_correcto) {
      correctWeighted += fb.confiabilidad;
    }
  }

  const accuracy = totalWeight > 0 ? (correctWeighted / totalWeight) * 100 : 0;

  const result = {
    accuracy: Math.round(accuracy * 100) / 100,
    verified_count: feedback.length,
    correct_weighted: Math.round(correctWeighted * 100) / 100,
    total_weighted: Math.round(totalWeight * 100) / 100
  };

  logger.debug(`✅ ${country_code} Accuracy: ${result.accuracy}%`);
  logger.debug(`   - Verificados: ${result.verified_count}`);
  logger.debug(`   - Correcto ponderado: ${result.correct_weighted}`);
  logger.debug(`   - Total ponderado: ${result.total_weighted}`);

  return result;
}

