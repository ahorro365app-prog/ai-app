import { NextRequest, NextResponse } from 'next/server'
import { CampaignExecutionError, executeCampaignById } from '@/lib/notificationCampaigns'
import { handleError, ErrorType } from '@/lib/errorHandler'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await executeCampaignById(params.id)
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    if (error instanceof CampaignExecutionError) {
      return handleError(
        error,
        error.message,
        ErrorType.VALIDATION,
        error.status
      )
    }
    return handleError(
      error,
      'Error ejecutando campaña',
      ErrorType.INTERNAL
    )
  }
}

