import { NextRequest, NextResponse } from 'next/server'
import { getTriggerStatus, updateTriggerConfig } from '@/lib/notificationCampaigns'

export async function GET(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const status = await getTriggerStatus(params.key)
    return NextResponse.json({ success: true, trigger: status })
  } catch (error: any) {
    console.error('Error obteniendo trigger:', error)
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Trigger no encontrado',
      },
      { status: 404 }
    )
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
    console.error('Error actualizando trigger:', error)
    const message = error?.message || 'Error actualizando trigger'
    const statusCode = message.includes('Trigger no encontrado') ? 404 : 500
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: statusCode }
    )
  }
}






