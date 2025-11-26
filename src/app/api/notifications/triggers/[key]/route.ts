import { NextRequest, NextResponse } from 'next/server'
import { getTriggerStatus, updateTriggerConfig } from '@/lib/notificationCampaigns'
import { handleError, ErrorType } from '@/lib/errorHandler'

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const status = await getTriggerStatus(params.key)
    return NextResponse.json({ success: true, trigger: status })
  } catch (error: any) {
    const errorType = error?.message?.includes('no encontrado') 
      ? ErrorType.NOT_FOUND 
      : undefined
    return handleError(error, 'Error obteniendo trigger', errorType)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const body = await request.json()
    const updates: { isActive?: boolean; settings?: Record<string, any> } = {}

    if (typeof body.isActive === 'boolean') {
      updates.isActive = body.isActive
    }

    if (body.settings && typeof body.settings === 'object') {
      updates.settings = body.settings
    }

    await updateTriggerConfig(params.key, updates)
    const status = await getTriggerStatus(params.key)
    return NextResponse.json({ success: true, trigger: status })
  } catch (error: any) {
    const errorType = error?.message?.includes('Trigger no encontrado') 
      ? ErrorType.NOT_FOUND 
      : undefined
    return handleError(error, 'Error actualizando trigger', errorType)
  }
}






