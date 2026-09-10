import { beforeEach, it, expect, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: vi.fn(), allowed: vi.fn(), source: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.user }))
vi.mock('@/lib/repositories/accounts', () => ({ canReadResult: mocks.allowed, AccountTestError: class extends Error {} }))
vi.mock('@/lib/repositories/attempts', () => ({ getResultSource: mocks.source }))
vi.mock('server-only', () => ({}))
import { GET } from '@/app/api/results/[attemptId]/route'
const attemptId = '30000000-0000-4000-8000-000000000001'
function get() { return GET(new Request('https://me.ly0688.online/api/results/' + attemptId), { params: Promise.resolve({ attemptId }) }) }
beforeEach(() => {
  vi.clearAllMocks(); mocks.user.mockResolvedValue({ id: 'u' }); mocks.allowed.mockResolvedValue(true)
  mocks.source.mockResolvedValue({ creatorNickname: '甲', friendNickname: '乙', score: 0, comparisons: Array.from({length:25},(_,i)=>({questionId:'q'+String(i+1).padStart(2,'0'), creatorAnswer:'A',friendAnswer:'B',isCorrect:false})) })
})
it('requires login before reading result data', async () => {
  mocks.user.mockResolvedValue(null)
  expect((await get()).status).toBe(401)
  expect(mocks.source).not.toHaveBeenCalled()
})
it('rejects unrelated users before fetching answers', async () => {
  mocks.allowed.mockResolvedValue(false)
  expect((await get()).status).toBe(404)
  expect(mocks.source).not.toHaveBeenCalled()
})
it('returns all mismatches to the authorized reader without caching', async () => {
  const response = await get()
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  const body = await response.json()
  expect(body.mismatches).toHaveLength(25)
  expect(body.comparisons).toBeUndefined()
})
it('returns 404 for replaced results', async () => {
  mocks.source.mockResolvedValue(null)
  expect((await get()).status).toBe(404)
})
