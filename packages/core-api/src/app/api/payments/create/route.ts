import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedUserId } from '@/lib/authHelpers';
import { handleError, handleValidationError, handleAuthError, ErrorType } from '@/lib/errorHandler';
import { createPaymentSchema, validateWithZod } from '@/lib/validations';
import { requireCSRF } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    const body = await req.json();
    
    // Validar CSRF token (después de leer el body para extraer el token)
    const csrfError = await requireCSRF(req, body.csrfToken);
    if (csrfError) {
      return csrfError;
    }
    
    // Validar con Zod
    const validation = validateWithZod(createPaymentSchema, body);
    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }
    
    const {
      plan,
      monto_usdt,
      direccion_wallet,
      hash_transaccion,
      comprobante_url,
      notas
    } = validation.data;

    // Obtener userId autenticado (desde sesión o header)
    const userId = await getAuthenticatedUserId(req);

    if (!userId) {
      return handleAuthError('Usuario no autenticado. Por favor, inicia sesión nuevamente.');
    }

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return handleError(userError || new Error('Usuario no encontrado'), 'Usuario no encontrado', ErrorType.NOT_FOUND);
    }

    // Verificar si ya tiene un pago pendiente o verificado reciente
    const { data: existingPayment } = await supabase
      .from('pagos')
      .select('id, estado, fecha_pago')
      .eq('usuario_id', userId)
      .in('estado', ['pendiente', 'verificado'])
      .gte('fecha_pago', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 30 días
      .single();

    if (existingPayment) {
      if (existingPayment.estado === 'verificado') {
        return NextResponse.json(
          { error: 'Ya tienes un pago verificado reciente. Tu plan Pro está activo.' },
          { status: 400 }
        );
      }
      if (existingPayment.estado === 'pendiente') {
        return NextResponse.json(
          { error: 'Ya tienes un pago pendiente. Espera la verificación o contáctanos si necesitas ayuda.' },
          { status: 400 }
        );
      }
    }

    // Crear registro de pago
    const { data: payment, error: paymentError } = await supabase
      .from('pagos')
      .insert({
        usuario_id: userId,
        plan: plan,
        monto_usdt: monto_usdt,
        direccion_wallet: direccion_wallet || null,
        hash_transaccion: hash_transaccion || null,
        comprobante_url: comprobante_url || null,
        estado: 'pendiente',
        notas: notas || null,
      })
      .select()
      .single();

    if (paymentError) {
      return handleError(paymentError, 'Error al crear registro de pago', ErrorType.DATABASE);
    }

    return NextResponse.json({
      success: true,
      payment: payment
    });

  } catch (error: any) {
    return handleError(error, 'Error al procesar el pago');
  }
}

