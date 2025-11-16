import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({
		ok: true,
		service: 'core',
		runtime: 'node',
		timestamp: Date.now()
	});
}


