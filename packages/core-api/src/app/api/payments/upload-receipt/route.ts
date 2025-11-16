import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedUserId } from '@/lib/authHelpers';
import { requireCSRF } from '@/lib/csrf';
import { handleError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    const formData = await req.formData();
    const csrfToken = formData.get('csrfToken') as string;
    
    // Validar CSRF token con el token extraído del formData
    const csrfError = await requireCSRF(req, csrfToken);
    if (csrfError) {
      return csrfError;
    }
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'payment-receipts';

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Obtener userId autenticado (desde header únicamente)
    const userId = await getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG o PDF' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      logger.error('Error subiendo archivo:', error);
      return NextResponse.json(
        { error: 'Error al subir el archivo. Inténtalo nuevamente.' },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: filePath
    });

  } catch (error: any) {
    return handleError(error, 'Error al subir el comprobante');
  }
}

