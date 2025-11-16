import { NextResponse } from 'next/server'
import { listTriggerStatuses } from '@/lib/notificationCampaigns'

export async function GET() {
  try {
    const triggers = await listTriggerStatuses()
    return NextResponse.json({ success: true, triggers })
  } catch (error: any) {
    console.error('Error obteniendo estado de triggers:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Error obteniendo estado de triggers',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    )
  }
}






