import { NextResponse } from 'next/server'
import { listTriggerStatuses } from '@/lib/notificationCampaigns'
import { handleError } from '@/lib/errorHandler'

export async function GET() {
  try {
    const triggers = await listTriggerStatuses()
    return NextResponse.json({ success: true, triggers })
  } catch (error: any) {
    return handleError(error, 'Error obteniendo estado de triggers')
  }
}






