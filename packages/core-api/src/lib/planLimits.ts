/**
 * Validaciones de límites según el plan de suscripción
 */

import { logger } from './logger';

export type SubscriptionPlan = 'free' | 'smart' | 'pro' | 'caducado';

export interface PlanLimits {
  // Transacciones
  maxDailyTransactions: number | null; // null = ilimitado
  maxAudioDurationSeconds: number | null; // null = ilimitado
  maxTextLength: number; // Máximo de caracteres por texto (aplicable a todos los planes)
  
  // Deudas
  maxActiveDebts: number;
  canCreateDebt: boolean;
  canEditDebt: boolean;
  canPayDebt: boolean;
  canDeleteDebt: boolean;
  daysToWaitAfterDeleteDebt: number; // Días de espera después de eliminar una deuda
  
  // Metas
  maxActiveGoals: number;
  canCreateGoal: boolean;
  canEditGoal: boolean;
  canUpdateGoal: boolean;
  canDeleteGoal: boolean;
  daysToWaitAfterDeleteGoal: number; // Días de espera después de eliminar una meta
  
  // Otras funcionalidades
  canExport: boolean;
  canCreateCustomCategories: boolean;
  hasAutoBackup: boolean;
  historicalDataLimit: 'all' | '4weeks' | null; // null = sin acceso
}

/**
 * Obtiene los límites del plan actual del usuario
 */
export function getPlanLimits(plan: SubscriptionPlan): PlanLimits {
  switch (plan) {
    case 'free':
      return {
        maxDailyTransactions: 10,
        maxAudioDurationSeconds: 15, // Máximo 15 segundos para todos los planes
        maxTextLength: 100, // Máximo 100 caracteres por texto
        maxActiveDebts: 1,
        canCreateDebt: true,
        canEditDebt: true,
        canPayDebt: true,
        canDeleteDebt: true,
        daysToWaitAfterDeleteDebt: 10,
        maxActiveGoals: 1,
        canCreateGoal: true,
        canEditGoal: true,
        canUpdateGoal: true,
        canDeleteGoal: true,
        daysToWaitAfterDeleteGoal: 10,
        canExport: true,
        canCreateCustomCategories: false,
        hasAutoBackup: false,
        historicalDataLimit: 'all',
      };
    
    case 'smart':
      return {
        maxDailyTransactions: 10, // 10 transacciones/día máximo
        maxAudioDurationSeconds: 15, // Máximo 15 segundos para todos los planes
        maxTextLength: 100, // Máximo 100 caracteres por texto
        maxActiveDebts: 1,
        canCreateDebt: true,
        canEditDebt: true,
        canPayDebt: true,
        canDeleteDebt: true,
        daysToWaitAfterDeleteDebt: 10,
        maxActiveGoals: 1,
        canCreateGoal: true,
        canEditGoal: true,
        canUpdateGoal: true,
        canDeleteGoal: true,
        daysToWaitAfterDeleteGoal: 10,
        canExport: true,
        canCreateCustomCategories: false,
        hasAutoBackup: false,
        historicalDataLimit: 'all',
      };
    
    case 'pro':
      return {
        maxDailyTransactions: 20, // 20 transacciones/día máximo
        maxAudioDurationSeconds: 15, // Máximo 15 segundos para todos los planes
        maxTextLength: 100, // Máximo 100 caracteres por texto
        maxActiveDebts: 5,
        canCreateDebt: true,
        canEditDebt: true,
        canPayDebt: true,
        canDeleteDebt: true,
        daysToWaitAfterDeleteDebt: 10,
        maxActiveGoals: 5,
        canCreateGoal: true,
        canEditGoal: true,
        canUpdateGoal: true,
        canDeleteGoal: true,
        daysToWaitAfterDeleteGoal: 10,
        canExport: true,
        canCreateCustomCategories: true,
        hasAutoBackup: true,
        historicalDataLimit: 'all',
      };
    
    case 'caducado':
      return {
        maxDailyTransactions: 3, // 3 transacciones/día máximo
        maxAudioDurationSeconds: 15, // Máximo 15 segundos para todos los planes
        maxTextLength: 100, // Máximo 100 caracteres por texto
        maxActiveDebts: 0, // No puede crear nuevas
        canCreateDebt: false,
        canEditDebt: false,
        canPayDebt: true, // Puede pagar deudas existentes
        canDeleteDebt: false,
        daysToWaitAfterDeleteDebt: 0,
        maxActiveGoals: 0, // No puede crear nuevas
        canCreateGoal: false,
        canEditGoal: false,
        canUpdateGoal: true, // Puede actualizar metas existentes
        canDeleteGoal: false,
        daysToWaitAfterDeleteGoal: 0,
        canExport: false,
        canCreateCustomCategories: false,
        hasAutoBackup: false,
        historicalDataLimit: '4weeks',
      };
    
    default:
      // Por defecto, asumir plan free
      return getPlanLimits('free');
  }
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
  errorCode?: string;
}

/**
 * Valida si el texto cumple con el límite de caracteres
 */
export function validateTextLength(
  plan: SubscriptionPlan,
  text: string
): ValidationResult {
  const limits = getPlanLimits(plan);
  
  if (text && text.length > limits.maxTextLength) {
    return {
      valid: false,
      message: `📝 El texto no puede exceder *${limits.maxTextLength} caracteres.* Por favor, envía un mensaje más corto. (${text.length}/${limits.maxTextLength} caracteres)`,
      errorCode: 'TEXT_LENGTH_EXCEEDED',
    };
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede crear una transacción
 */
export async function validateCanCreateTransaction(
  plan: SubscriptionPlan,
  userId: string,
  supabase: any, // Cliente de Supabase
  audioDurationSeconds?: number,
  textContent?: string
): Promise<ValidationResult> {
  const limits = getPlanLimits(plan);
  
  // Validar duración de audio (15 segundos máximo para todos los planes)
  if (audioDurationSeconds !== undefined && limits.maxAudioDurationSeconds !== null) {
    if (audioDurationSeconds > limits.maxAudioDurationSeconds) {
      return {
        valid: false,
        message: `🔇 El audio no puede exceder *${limits.maxAudioDurationSeconds} segundos.* Por favor, envía un audio más corto.`,
        errorCode: 'AUDIO_DURATION_EXCEEDED',
      };
    }
  }
  
  // Validar longitud de texto (100 caracteres máximo para todos los planes)
  if (textContent !== undefined && textContent !== null) {
    const textValidation = validateTextLength(plan, textContent);
    if (!textValidation.valid) {
      return textValidation;
    }
  }
  
  // Validar límite diario de transacciones (incluir eliminadas para evitar sortear el límite)
  if (limits.maxDailyTransactions !== null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    logger.debug('🔍 Validando límite diario:', {
      plan,
      maxDailyTransactions: limits.maxDailyTransactions,
      userId,
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString()
    });
    
    // Contar TODAS las transacciones creadas HOY (por fecha_creacion, no por fecha)
    // Esto incluye: activas + eliminadas + de ayer creadas hoy
    // Esto previene que los usuarios eliminen y vuelvan a crear para sortear el límite
    const { count, error } = await supabase
      .from('transacciones')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', userId)
      .gte('fecha_creacion', today.toISOString())
      .lt('fecha_creacion', tomorrow.toISOString());
    
    logger.debug('📊 Resultado del conteo (todas las transacciones del día):', { count, error });
    
    if (error) {
      logger.error('❌ Error checking transaction limit:', error);
      // En caso de error, permitir la creación para no bloquear al usuario
      return { valid: true };
    }
    
    if (count !== null && count >= limits.maxDailyTransactions) {
      logger.warn(`⚠️ Límite diario excedido: ${count}/${limits.maxDailyTransactions}`);
      return {
        valid: false,
        message: `🚨 Has alcanzado el límite de *${limits.maxDailyTransactions} transacciones diarias.* Puedes crear más transacciones mañana o actualizar a un plan superior. 💜`,
        errorCode: 'DAILY_TRANSACTION_LIMIT_EXCEEDED',
      };
    }
    
    logger.debug(`✅ Límite diario OK: ${count}/${limits.maxDailyTransactions}`);
  }
  
  return { valid: true };
}

/**
 * Valida límite de transacciones para múltiples transacciones
 * Retorna información detallada para mensajes personalizados
 */
export async function validateTransactionLimitForMultiple(
  plan: SubscriptionPlan,
  userId: string,
  requestedCount: number,
  supabase: any
): Promise<{
  canProcessAll: boolean;
  currentCount: number;
  maxAllowed: number;
  requestedCount: number;
  canProcessCount: number;
  remainingSlots: number;
  message?: string;
}> {
  const limits = getPlanLimits(plan);
  
  // Si no hay límite, permitir todas
  if (limits.maxDailyTransactions === null) {
    return {
      canProcessAll: true,
      currentCount: 0,
      maxAllowed: Infinity,
      requestedCount,
      canProcessCount: requestedCount,
      remainingSlots: Infinity
    };
  }
  
  // Contar transacciones creadas HOY (por fecha_creacion, no por fecha)
  // Esto incluye: activas + eliminadas + de ayer creadas hoy
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const { count, error } = await supabase
    .from('transacciones')
    .select('*', { count: 'exact', head: true })
    .eq('usuario_id', userId)
    .gte('fecha_creacion', today.toISOString())
    .lt('fecha_creacion', tomorrow.toISOString());
  
  if (error) {
    logger.error('❌ Error checking transaction limit for multiple:', error);
    // En caso de error, permitir para no bloquear
    return {
      canProcessAll: true,
      currentCount: 0,
      maxAllowed: limits.maxDailyTransactions,
      requestedCount,
      canProcessCount: requestedCount,
      remainingSlots: limits.maxDailyTransactions
    };
  }
  
  const currentCount = count || 0;
  const maxAllowed = limits.maxDailyTransactions;
  const remainingSlots = Math.max(0, maxAllowed - currentCount);
  const canProcessCount = Math.min(requestedCount, remainingSlots);
  const canProcessAll = requestedCount <= remainingSlots;
  
  logger.debug('🔍 Validación límite múltiple:', {
    plan,
    currentCount,
    maxAllowed,
    requestedCount,
    canProcessCount,
    remainingSlots,
    canProcessAll
  });
  
  // Si puede procesar todas, no necesita mensaje
  if (canProcessAll) {
    return {
      canProcessAll: true,
      currentCount,
      maxAllowed,
      requestedCount,
      canProcessCount,
      remainingSlots
    };
  }
  
  // Si no puede procesar todas, generar mensaje
  let message: string;
  if (remainingSlots === 0) {
    // Límite completamente alcanzado
    message = `🚨 Has alcanzado el límite de *${maxAllowed} transacciones diarias.* Puedes crear más transacciones mañana o actualizar a un plan superior. 💜`;
  } else {
    // Límite parcial
    const ejemplo = remainingSlots === 1 
      ? "Ejemplo: 'Gasté 50 en taxi'"
      : remainingSlots === 2
      ? "Ejemplo: 'Gasté 50 en taxi y 30 en comida'"
      : `Ejemplo: 'Gasté X en...' (máximo ${remainingSlots} transacciones)`;
    
    message = `⚠️ *Límite parcial*\nYa has realizado ${currentCount} transacciones hoy. Solo puedes guardar ${remainingSlots} más.\nPor favor, envía un nuevo mensaje con solo ${remainingSlots} transacción${remainingSlots > 1 ? 'es' : ''} (o menos).\n${ejemplo}`;
  }
  
  return {
    canProcessAll: false,
    currentCount,
    maxAllowed,
    requestedCount,
    canProcessCount: 0, // No procesar ninguna si no puede todas
    remainingSlots,
    message
  };
}

/**
 * Valida si el usuario puede crear una deuda
 */
export async function validateCanCreateDebt(
  plan: SubscriptionPlan,
  userId: string,
  supabase: any
): Promise<ValidationResult> {
  const limits = getPlanLimits(plan);
  
  if (!limits.canCreateDebt) {
    return {
      valid: false,
      message: 'Tu plan no permite crear nuevas deudas. Actualiza a Pro para crear hasta 5 deudas.',
      errorCode: 'CANNOT_CREATE_DEBT',
    };
  }
  
  // Contar deudas activas (sin fecha_eliminacion)
  const { data: activeDebts, error: countError } = await supabase
    .from('deudas')
    .select('id, fecha_eliminacion')
    .eq('usuario_id', userId)
    .is('fecha_eliminacion', null);
  
  if (countError) {
    logger.error('Error checking active debts:', countError);
    return { valid: true }; // En caso de error, permitir
  }
  
  const activeDebtsCount = activeDebts?.length || 0;
  
  if (activeDebtsCount >= limits.maxActiveDebts) {
    return {
      valid: false,
      message: `Has alcanzado el límite de ${limits.maxActiveDebts} ${limits.maxActiveDebts === 1 ? 'deuda activa' : 'deudas activas'}. Actualiza a Pro para crear hasta 5 deudas.`,
      errorCode: 'MAX_ACTIVE_DEBTS_EXCEEDED',
    };
  }
  
  // Verificar si hay una deuda eliminada recientemente (dentro de los días de espera)
  const { data: deletedDebts, error: deletedError } = await supabase
    .from('deudas')
    .select('fecha_eliminacion')
    .eq('usuario_id', userId)
    .not('fecha_eliminacion', 'is', null)
    .order('fecha_eliminacion', { ascending: false })
    .limit(1);
  
  if (deletedError) {
    logger.error('Error checking deleted debts:', deletedError);
    // Continuar con la validación si hay error
  } else if (deletedDebts && deletedDebts.length > 0) {
    const lastDeletedDate = new Date(deletedDebts[0].fecha_eliminacion);
    const now = new Date();
    const daysSinceDelete = Math.floor((now.getTime() - lastDeletedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelete < limits.daysToWaitAfterDeleteDebt) {
      const daysRemaining = limits.daysToWaitAfterDeleteDebt - daysSinceDelete;
      return {
        valid: false,
        message: `Debes esperar ${daysRemaining} ${daysRemaining === 1 ? 'día más' : 'días más'} antes de crear una nueva deuda después de eliminar una.`,
        errorCode: 'DEBT_COOLDOWN_ACTIVE',
      };
    }
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede crear una meta
 */
export async function validateCanCreateGoal(
  plan: SubscriptionPlan,
  userId: string,
  supabase: any
): Promise<ValidationResult> {
  const limits = getPlanLimits(plan);
  
  if (!limits.canCreateGoal) {
    return {
      valid: false,
      message: 'Tu plan no permite crear nuevas metas. Actualiza a Pro para crear hasta 5 metas.',
      errorCode: 'CANNOT_CREATE_GOAL',
    };
  }
  
  // Contar metas activas (sin fecha_eliminacion)
  const { data: activeGoals, error: countError } = await supabase
    .from('metas')
    .select('id, fecha_eliminacion')
    .eq('usuario_id', userId)
    .is('fecha_eliminacion', null);
  
  if (countError) {
    logger.error('Error checking active goals:', countError);
    return { valid: true }; // En caso de error, permitir
  }
  
  const activeGoalsCount = activeGoals?.length || 0;
  
  if (activeGoalsCount >= limits.maxActiveGoals) {
    return {
      valid: false,
      message: `Has alcanzado el límite de ${limits.maxActiveGoals} ${limits.maxActiveGoals === 1 ? 'meta activa' : 'metas activas'}. Actualiza a Pro para crear hasta 5 metas.`,
      errorCode: 'MAX_ACTIVE_GOALS_EXCEEDED',
    };
  }
  
  // Verificar si hay una meta eliminada recientemente (dentro de los días de espera)
  const { data: deletedGoals, error: deletedError } = await supabase
    .from('metas')
    .select('fecha_eliminacion')
    .eq('usuario_id', userId)
    .not('fecha_eliminacion', 'is', null)
    .order('fecha_eliminacion', { ascending: false })
    .limit(1);
  
  if (deletedError) {
    logger.error('Error checking deleted goals:', deletedError);
    // Continuar con la validación si hay error
  } else if (deletedGoals && deletedGoals.length > 0) {
    const lastDeletedDate = new Date(deletedGoals[0].fecha_eliminacion);
    const now = new Date();
    const daysSinceDelete = Math.floor((now.getTime() - lastDeletedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelete < limits.daysToWaitAfterDeleteGoal) {
      const daysRemaining = limits.daysToWaitAfterDeleteGoal - daysSinceDelete;
      return {
        valid: false,
        message: `Debes esperar ${daysRemaining} ${daysRemaining === 1 ? 'día más' : 'días más'} antes de crear una nueva meta después de eliminar una.`,
        errorCode: 'GOAL_COOLDOWN_ACTIVE',
      };
    }
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede editar una deuda
 */
export function validateCanEditDebt(plan: SubscriptionPlan): ValidationResult {
  const limits = getPlanLimits(plan);
  
  if (!limits.canEditDebt) {
    return {
      valid: false,
      message: 'Tu plan no permite editar deudas. Actualiza a Pro para editar tus deudas.',
      errorCode: 'CANNOT_EDIT_DEBT',
    };
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede pagar una deuda
 */
export function validateCanPayDebt(plan: SubscriptionPlan): ValidationResult {
  const limits = getPlanLimits(plan);
  
  if (!limits.canPayDebt) {
    return {
      valid: false,
      message: 'Tu plan no permite realizar pagos de deudas. Actualiza a Pro para pagar tus deudas.',
      errorCode: 'CANNOT_PAY_DEBT',
    };
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede actualizar una meta
 */
export function validateCanUpdateGoal(plan: SubscriptionPlan): ValidationResult {
  const limits = getPlanLimits(plan);
  
  if (!limits.canUpdateGoal) {
    return {
      valid: false,
      message: 'Tu plan no permite actualizar metas. Actualiza a Pro para actualizar tus metas.',
      errorCode: 'CANNOT_UPDATE_GOAL',
    };
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede eliminar una deuda
 */
export function validateCanDeleteDebt(plan: SubscriptionPlan): ValidationResult {
  const limits = getPlanLimits(plan);
  
  if (!limits.canDeleteDebt) {
    return {
      valid: false,
      message: 'Tu plan no permite eliminar deudas.',
      errorCode: 'CANNOT_DELETE_DEBT',
    };
  }
  
  return { valid: true };
}

/**
 * Valida si el usuario puede eliminar una meta
 */
export function validateCanDeleteGoal(plan: SubscriptionPlan): ValidationResult {
  const limits = getPlanLimits(plan);
  
  if (!limits.canDeleteGoal) {
    return {
      valid: false,
      message: 'Tu plan no permite eliminar metas.',
      errorCode: 'CANNOT_DELETE_GOAL',
    };
  }
  
  return { valid: true };
}

