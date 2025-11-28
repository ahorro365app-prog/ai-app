import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';
import { handleError, ErrorType } from '@/lib/errorHandler';
import { getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/whatsapp/transactions
 * 
 * Obtiene transacciones procesadas desde WhatsApp con información relacionada.
 * 
 * Query params:
 * - page: número de página (default: 1)
 * - limit: items por página (default: 20, max: 100)
 * - search: búsqueda por número de teléfono o nombre de usuario
 * - status: filtro por estado de confirmación ('pending', 'confirmed', 'rejected')
 * - dateFrom: fecha desde (YYYY-MM-DD)
 * - dateTo: fecha hasta (YYYY-MM-DD)
 * - minAmount: monto mínimo
 * - maxAmount: monto máximo
 * 
 * @returns Lista de transacciones con información de predicción y usuario
 */
export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    // 1. Rate limiting (opcional, pero recomendado)
    const identifier = getClientIdentifier(request);
    // Por ahora, no aplicamos rate limiting estricto, pero podemos agregarlo después

    // 2. Parsear query params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // 'pending', 'confirmed', 'rejected'
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const minAmount = searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : null;
    const maxAmount = searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : null;

    const offset = (page - 1) * limit;

    logger.debug('📊 Obteniendo transacciones de WhatsApp:', {
      page,
      limit,
      search: search.substring(0, 20) + '...',
      status,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount
    });

    // 3. Construir query base
    // Query principal: obtener predicciones de WhatsApp
    let query = supabase
      .from('predicciones_groq')
      .select(`
        id,
        usuario_id,
        transcripcion,
        resultado,
        confirmado,
        confirmado_por,
        wa_message_id,
        parent_message_id,
        mensaje_origen,
        original_timestamp,
        created_at,
        updated_at
      `)
      .eq('mensaje_origen', 'whatsapp')
      .order('original_timestamp', { ascending: false });

    // 4. Aplicar filtros

    // Filtro por estado de confirmación
    if (status === 'pending') {
      query = query.is('confirmado', null);
    } else if (status === 'confirmed') {
      query = query.eq('confirmado', true);
    } else if (status === 'rejected') {
      query = query.eq('confirmado', false);
    }

    // Filtro por fecha
    if (dateFrom) {
      query = query.gte('original_timestamp', `${dateFrom}T00:00:00Z`);
    }
    if (dateTo) {
      query = query.lte('original_timestamp', `${dateTo}T23:59:59Z`);
    }

    // Filtro por búsqueda (número de teléfono o nombre)
    if (search) {
      // Buscar en usuarios por teléfono o nombre
      // Nota: Supabase no permite JOIN con LIKE fácilmente, así que haremos dos queries
      // Primero obtenemos los IDs de usuarios que coinciden
      const { data: matchingUsers } = await supabase
        .from('usuarios')
        .select('id')
        .or(`telefono.ilike.%${search}%,nombre.ilike.%${search}%`);

      if (matchingUsers && matchingUsers.length > 0) {
        const userIds = matchingUsers.map(u => u.id);
        query = query.in('usuario_id', userIds);
      } else {
        // Si no hay usuarios que coincidan, retornar vacío
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // 5. Obtener total para paginación (antes de aplicar limit/offset)
    const { count: totalCount } = await query.select('*', { count: 'exact', head: true });

    // 6. Aplicar paginación
    query = query.range(offset, offset + limit - 1);

    // 7. Ejecutar query
    const { data: predictions, error: predictionsError } = await query;

    if (predictionsError) {
      logger.error('❌ Error obteniendo predicciones:', predictionsError);
      return handleError(
        predictionsError,
        'Error al obtener transacciones de WhatsApp',
        ErrorType.DATABASE
      );
    }

    // 8. Obtener IDs únicos de usuarios para buscar información
    const userIdsSet = new Set<string>();
    (predictions || []).forEach(p => {
      if (p.usuario_id) {
        userIdsSet.add(p.usuario_id);
      }
    });
    const userIds = Array.from(userIdsSet);
    
    // 9. Buscar información de usuarios
    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono, pais, country_code')
      .in('id', userIds);

    const usuariosMap = new Map<string, any>();
    (usuarios || []).forEach((u: any) => {
      usuariosMap.set(u.id, u);
    });

    // 10. Para cada predicción, buscar transacciones relacionadas
    // Las transacciones se relacionan por usuario_id y fecha (con margen de 1 minuto)
    const predictionsWithTransactions = await Promise.all(
      (predictions || []).map(async (prediction) => {
        // Buscar transacciones relacionadas
        // Relación: mismo usuario_id y fecha similar (dentro de 1 minuto)
        const predictionDate = new Date(prediction.original_timestamp);
        const dateStart = new Date(predictionDate.getTime() - 60000); // 1 minuto antes
        const dateEnd = new Date(predictionDate.getTime() + 60000); // 1 minuto después

        const { data: transactions } = await supabase
          .from('transacciones')
          .select('*')
          .eq('usuario_id', prediction.usuario_id)
          .gte('fecha', dateStart.toISOString())
          .lte('fecha', dateEnd.toISOString())
          .order('fecha', { ascending: false });

        // Aplicar filtros de monto si existen
        let filteredTransactions = transactions || [];
        if (minAmount !== null) {
          filteredTransactions = filteredTransactions.filter(t => t.monto >= minAmount);
        }
        if (maxAmount !== null) {
          filteredTransactions = filteredTransactions.filter(t => t.monto <= maxAmount);
        }

        // Obtener información del usuario
        const usuario = usuariosMap.get(prediction.usuario_id);

        return {
          prediction: {
            id: prediction.id,
            transcripcion: prediction.transcripcion,
            resultado: prediction.resultado,
            confirmado: prediction.confirmado,
            confirmado_por: prediction.confirmado_por,
            wa_message_id: prediction.wa_message_id,
            parent_message_id: prediction.parent_message_id,
            original_timestamp: prediction.original_timestamp,
            created_at: prediction.created_at,
            updated_at: prediction.updated_at
          },
          usuario: usuario ? {
            id: usuario.id,
            nombre: usuario.nombre,
            telefono: usuario.telefono,
            pais: usuario.pais,
            country_code: usuario.country_code
          } : null,
          transacciones: filteredTransactions || []
        };
      })
    );

    // 11. Si hay filtros de monto, filtrar también a nivel de predicción
    let filteredData = predictionsWithTransactions;
    if (minAmount !== null || maxAmount !== null) {
      filteredData = predictionsWithTransactions.filter(item => {
        // Verificar si alguna transacción cumple con los filtros de monto
        if (item.transacciones.length > 0) {
          return item.transacciones.some(t => {
            if (minAmount !== null && t.monto < minAmount) return false;
            if (maxAmount !== null && t.monto > maxAmount) return false;
            return true;
          });
        }
        // Si no hay transacciones, verificar el resultado de la predicción
        if (item.prediction.resultado && typeof item.prediction.resultado === 'object') {
          const resultado = item.prediction.resultado as any;
          const monto = resultado.monto || (resultado.transacciones && resultado.transacciones[0]?.monto);
          if (monto) {
            if (minAmount !== null && monto < minAmount) return false;
            if (maxAmount !== null && monto > maxAmount) return false;
            return true;
          }
        }
        return false;
      });
    }

    // 12. Calcular total de páginas
    const total = totalCount || 0;
    const totalPages = Math.ceil(total / limit);

    logger.debug('✅ Transacciones obtenidas:', {
      count: filteredData.length,
      total,
      page,
      totalPages
    });

    // 13. Retornar respuesta
    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error: any) {
    logger.error('❌ Error inesperado obteniendo transacciones de WhatsApp:', error);
    return handleError(
      error,
      'Error inesperado al obtener transacciones de WhatsApp',
      ErrorType.INTERNAL
    );
  }
}

