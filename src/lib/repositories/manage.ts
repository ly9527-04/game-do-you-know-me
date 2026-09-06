import 'server-only'

import { RepositoryError } from '@/lib/repositories/tests'
import { createServerDb } from '@/lib/supabase/server'

export interface ManageEntry {
  attemptId: string
  nickname: string
  score: number
  createdAt: string
}

export interface ManageSummary {
  creatorNickname: string
  shareCode: string
  challengeCount: number
  averageScore: number
  entries: ManageEntry[]
}

export async function getManageSummary(testId: string): Promise<ManageSummary | null> {
  const db = createServerDb()
  const testResult = await db.from('tests').select('nickname, share_code').eq('id', testId).maybeSingle()
  if (testResult.error) throw new RepositoryError('get managed test')
  if (!testResult.data) return null

  const attemptsResult = await db
    .from('attempts')
    .select('id, nickname, score, created_at')
    .eq('test_id', testId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
  if (attemptsResult.error) throw new RepositoryError('get manage summary')

  const test = testResult.data as unknown as { nickname: string; share_code: string }
  const rows = (attemptsResult.data ?? []) as unknown as {
    id: string; nickname: string; score: number; created_at: string
  }[]
  const total = rows.reduce((sum, row) => sum + row.score, 0)
  return {
    creatorNickname: test.nickname,
    shareCode: test.share_code,
    challengeCount: rows.length,
    averageScore: rows.length === 0 ? 0 : total / rows.length,
    entries: rows.map((row) => ({
      attemptId: row.id,
      nickname: row.nickname,
      score: row.score,
      createdAt: row.created_at,
    })),
  }
}
