import 'server-only'
import { createServerDb } from '@/lib/supabase/server'
import { getPublicTest, RepositoryError } from '@/lib/repositories/tests'
import { createShareCode, createManageToken, hashToken } from '@/lib/security'
import type { QuizAnswers } from '@/types/domain'

export type OwnedTest = { id: string; nickname: string; share_code: string; owner_id: string }
export async function getOwnedTest(userId: string): Promise<OwnedTest | null> {
  const { data, error } = await createServerDb().from('tests')
    .select('id,nickname,share_code,owner_id').eq('owner_id', userId).maybeSingle()
  if (error) throw new RepositoryError('get owned test')
  return data as OwnedTest | null
}
export async function getFriendTest(account: string) {
  const { data, error } = await createServerDb().from('user_accounts').select('id,nickname,account').eq('account', account).maybeSingle()
  if (error) throw new RepositoryError('find friend')
  if (!data) return null
  const owned = await getOwnedTest(data.id)
  if (!owned) return { userId: data.id as string, nickname: data.nickname as string, test: null }
  const test = await getPublicTest(owned.share_code)
  return { userId: data.id as string, nickname: data.nickname as string, test }
}
export async function getUserAttempt(userId: string, testId: string): Promise<string | null> {
  const { data, error } = await createServerDb().from('attempts').select('id').eq('user_id', userId).eq('test_id', testId).maybeSingle()
  if (error) throw new RepositoryError('find existing attempt')
  return data?.id ?? null
}
export class AccountTestError extends Error {
  constructor(readonly code: string) { super(code) }
}
function rpcError(message?: string): never {
  const code = ['TEST_CHANGED', 'OWN_TEST', 'INVALID_SELECTION', 'INVALID_ANSWERS'].find((item) => message?.includes(item))
  throw new AccountTestError(code ?? 'UNAVAILABLE')
}
export async function replaceAccountTest(input: {
  userId: string; testId: string; previousTestId: string | null; questionSetId: string; questionIds: string[]; answers: QuizAnswers
}) {
  const { data, error } = await createServerDb().rpc('replace_account_test', {
    p_user_id: input.userId, p_test_id: input.testId, p_previous_test_id: input.previousTestId,
    p_question_set_id: input.questionSetId, p_question_ids: input.questionIds, p_answers: input.answers,
    p_share_code: createShareCode(), p_manage_token_hash: hashToken(createManageToken()),
  })
  if (error || typeof data !== 'string') rpcError(error?.message)
  return data as string
}
export async function submitAccountAttempt(userId: string, testId: string, answers: QuizAnswers) {
  const { data, error } = await createServerDb().rpc('submit_account_attempt', { p_user_id: userId, p_test_id: testId, p_answers: answers })
  if (error || typeof data !== 'string') rpcError(error?.message)
  return data as string
}
export async function canReadResult(userId: string, attemptId: string): Promise<boolean> {
  const { data, error } = await createServerDb().from('attempts').select('user_id,tests!inner(owner_id)').eq('id', attemptId).maybeSingle()
  if (error) throw new RepositoryError('check result owner')
  const row = data as unknown as { user_id: string | null; tests: { owner_id: string | null } } | null
  return Boolean(row && (row.user_id === userId || row.tests.owner_id === userId))
}
