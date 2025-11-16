import { NextRequest, NextResponse } from 'next/server'
import { runTriggerByKey } from '@/lib/notificationCampaigns'

export async function POST(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    let payload: any = undefined
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        payload = await request.json()
      } catch {
        payload = undefined
      }
    }

    const result = await runTriggerByKey(params.key, payload)
    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error ejecutando trigger manualmente:', error)
    const message = error?.message || 'Error ejecutando trigger'
    const statusCode = message.includes('Trigger no encontrado') ? 404 : 500
    return NextResponse.json({ success: false, message }, { status: statusCode })
  }
}

