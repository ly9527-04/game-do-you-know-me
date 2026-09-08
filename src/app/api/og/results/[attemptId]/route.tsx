import { ImageResponse } from 'next/og'
import { getResultSource } from '@/lib/repositories/attempts'
import { getVerdict } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params
  const source = await getResultSource(attemptId)
  if (!source) return new ImageResponse(<div style={{ fontSize: 56, padding: 80 }}>结果暂时找不到</div>, { width: 1200, height: 1600 })

  return new ImageResponse(
    <div style={{ background: '#070913', color: '#f8fafc', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: 90, width: '100%', border: '12px solid #312e81' }}>
      <div style={{ display: 'flex', fontSize: 42, fontWeight: 800, color: '#f472b6' }}>你真的懂我吗</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', fontSize: 34 }}>{source.friendNickname} 猜 {source.creatorNickname}</div>
        <div style={{ color: '#22d3ee', display: 'flex', fontSize: 170, fontWeight: 900 }}>{source.score}%</div>
        <div style={{ color: '#34d399', display: 'flex', fontSize: 32 }}>答对 {source.score / 4} / 25 题 · 默契度</div>
        <div style={{ display: 'flex', fontSize: 48, lineHeight: 1.25 }}>{getVerdict(source.score)}</div>
      </div>
      <div style={{ display: 'flex', fontSize: 32, color: '#a5b4fc' }}>me.ly0688.online</div>
    </div>,
    { width: 1200, height: 1600 },
  )
}
