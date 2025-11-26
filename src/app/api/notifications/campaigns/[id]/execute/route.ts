import { NextRequest, NextResponse } from 'next/server'
import { CampaignExecutionError, executeCampaignById } from '@/lib/notificationCampaigns'
import { handleError } from '@/lib/errorHandler'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await executeCampaignById(params.id)
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    if (error instanceof CampaignExecutionError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      )
    }
    return handleError(error, 'Error ejecutando campaña')
  }
}

