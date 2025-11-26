import { NextRequest, NextResponse } from 'next/server'
import { runTriggerByKey } from '@/lib/notificationCampaigns'
import { handleError, handleNotFoundError, ErrorType } from '@/lib/errorHandler'

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
    if (error?.message?.includes('Trigger no encontrado')) {
      return handleNotFoundError('Trigger')
    }
    return handleError(
      error,
      'Error ejecutando trigger',
      ErrorType.INTERNAL
    )
  }
}

