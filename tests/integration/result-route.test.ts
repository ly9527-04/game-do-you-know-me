import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getResultSource: vi.fn(),
  getVerdict: vi.fn(),
  selectMismatches: vi.fn(),
}))
vi.mock('@/lib/repositories/attempts', () => ({ getResultSource: mocks.getResultSource }))
vi.mock('@/lib/scoring', () => ({ getVerdict: mocks.getVerdict, selectMismatches: mocks.selectMismatches }))
vi.mock('server-only', () => ({}))

import { GET } from '@/app/api/results/[attemptId]/route'

const attemptId = '30000000-0000-4000-8000-000000000001'
const source = {
  attemptId,
  creatorNickname: '阿钙',
  friendNickname: '小明',
  score: 76,
  comparisons: Array.from({ length: 25 }, (_, index) => ({ questionId: `q${String(index + 1).padStart(2, '0')}`, creatorAnswer: 'A', friendAnswer: index < 6 ? 'B' : 'A', isCorrect: index >= 6 })),
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getResultSource.mockResolvedValue(source)
  mocks.getVerdict.mockReturnValue('很熟，但还是藏了一些你不知道的东西。')
  mocks.selectMismatches.mockReturnValue([
    { questionId: 'q01', prompt: '一', creatorAnswer: 'A', creatorAnswerText: '甲', friendAnswer: 'B', friendAnswerText: '乙' },
    { questionId: 'q02', prompt: '二', creatorAnswer: 'A', creatorAnswerText: '甲', friendAnswer: 'B', friendAnswerText: '乙' },
    { questionId: 'q03', prompt: '三', creatorAnswer: 'A', creatorAnswerText: '甲', friendAnswer: 'B', friendAnswerText: '乙' },
  ])
})

describe('GET /api/results/:attemptId', () => {
  it('returns at most three mismatches and never serializes full comparisons', async () => {
    const response = await GET(new Request(`https://me.ly0688.online/api/results/${attemptId}`), { params: Promise.resolve({ attemptId }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(body).toMatchObject({ creatorNickname: '阿钙', friendNickname: '小明', score: 76, verdict: '很熟，但还是藏了一些你不知道的东西。' })
    expect(body.mismatches).toHaveLength(3)
    expect(JSON.stringify(body)).not.toContain('comparisons')
    expect(JSON.stringify(body)).not.toContain('q25')
  })

  it('keeps two mismatches and returns the perfect-score easter egg', async () => {
    mocks.getResultSource.mockResolvedValue({ ...source, score: 100 })
    mocks.getVerdict.mockReturnValue('离谱，你是真的懂 TA。')
    mocks.selectMismatches.mockReturnValue([])

    const response = await GET(new Request(`https://me.ly0688.online/api/results/${attemptId}`), { params: Promise.resolve({ attemptId }) })
    const body = await response.json()

    expect(body).toMatchObject({ score: 100, verdict: '离谱，你是真的懂 TA。', mismatches: [] })
  })

  it('returns 404 when an attempt does not exist', async () => {
    mocks.getResultSource.mockResolvedValue(null)
    const response = await GET(new Request(`https://me.ly0688.online/api/results/${attemptId}`), { params: Promise.resolve({ attemptId }) })
    expect(response.status).toBe(404)
  })
})
