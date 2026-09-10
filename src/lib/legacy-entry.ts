import { NextResponse } from 'next/server'
export function retiredEntry() {
  return NextResponse.json({ error: { code: 'ENTRY_RETIRED', message: '请打开官网，登录后通过朋友的8位账号进入测试。' } }, { status: 410, headers: { 'Cache-Control': 'no-store' } })
}
