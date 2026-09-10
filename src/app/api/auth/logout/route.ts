import { NextResponse } from 'next/server'
import { assertSameOrigin, authFailure, revokeSession } from '@/lib/auth'
export const runtime = 'nodejs'
export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    await revokeSession()
    return NextResponse.json({ user: null }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) { return authFailure(error) }
}
