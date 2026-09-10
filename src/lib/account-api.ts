import { NextResponse } from 'next/server'
import { AccountTestError } from '@/lib/repositories/accounts'
import { RateLimitError } from '@/lib/rate-limit'
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: { message } }, { status, headers: { 'Cache-Control': 'private, no-store' } })
}
export function accountApiError(error: unknown) {
  if (error instanceof RateLimitError) return apiError(error.reason === 'exceeded' ? '操作有点频繁，请稍后再试。' : '服务暂时不可用，请稍后再试。', error.reason === 'exceeded' ? 429 : 503)
  if (error instanceof AccountTestError && error.code === 'TEST_CHANGED') return apiError('测试已更新，请返回首页重新进入。', 409)
  if (error instanceof AccountTestError && error.code === 'OWN_TEST') return apiError('不能挑战自己的测试。', 403)
  if (error instanceof AccountTestError && error.code.startsWith('INVALID_')) return apiError('请完整选择并回答25道题。')
  return apiError('服务暂时不可用，请稍后再试。', 503)
}
export async function readAccountBody(request: Request): Promise<unknown> {
  const body = await request.text()
  if (new TextEncoder().encode(body).length > 32768) throw new Error('Body too large')
  return JSON.parse(body)
}
