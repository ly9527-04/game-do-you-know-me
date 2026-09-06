import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getManageSummary } from '@/lib/repositories/manage'
import { manageCookieName, verifyManageSession } from '@/lib/manage-session'
import { getCanonicalOrigin } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ testId: string }> }) {
  const { testId } = await params
  const cookieStore = await cookies()
  const serialized = cookieStore.get(manageCookieName())?.value
  if (!serialized) return unauthorized(401)

  let session
  try {
    session = verifyManageSession(serialized)
  } catch {
    return unauthorized(401)
  }
  if (!session) return unauthorized(401)
  if (session.testId !== testId) return NextResponse.json({ error: { code: 'MANAGE_FORBIDDEN', message: '这个管理链接不属于当前测试。' } }, { status: 403 })

  try {
    const summary = await getManageSummary(testId)
    if (!summary) return NextResponse.json({ error: { code: 'TEST_NOT_FOUND', message: '找不到这张测试卡。' } }, { status: 404 })
    const origin = getCanonicalOrigin()
    const response = NextResponse.json({ ...summary, averageScore: Math.round(summary.averageScore), shareUrl: new URL(`/t/${summary.shareCode}`, origin).toString() })
    response.headers.set('Cache-Control', 'private, no-store')
    return response
  } catch {
    return NextResponse.json({ error: { code: 'MANAGE_UNAVAILABLE', message: '排行榜暂时打不开，请稍后再试。' } }, { status: 503 })
  }
}

function unauthorized(status: 401) {
  return NextResponse.json({ error: { code: 'MANAGE_UNAUTHORIZED', message: '请先使用管理链接进入。' } }, { status })
}
