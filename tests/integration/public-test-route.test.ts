import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getPublicTest } = vi.hoisted(() => ({ getPublicTest: vi.fn() }))
vi.mock('@/lib/repositories/tests', () => ({ getPublicTest }))
vi.mock('server-only', () => ({}))

import { QUESTIONS } from '@/lib/questions'
import { GET } from '@/app/api/tests/[shareCode]/route'

const testId = '10000000-0000-4000-8000-000000000001'

beforeEach(() => vi.clearAllMocks())

describe('GET /api/tests/:shareCode', () => {
  it('returns public question data without creator answers or management secrets', async () => {
    getPublicTest.mockResolvedValue({ testId, creatorNickname: '阿钙', questionSetVersion: 1, questions: QUESTIONS })

    const response = await GET(new Request('https://me.ly0688.online/api/tests/share'), { params: Promise.resolve({ shareCode: 'share' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(body).toMatchObject({ testId, creatorNickname: '阿钙', questionSetVersion: 1 })
    expect(body.questions).toHaveLength(25)
    expect(JSON.stringify(body)).not.toMatch(/creatorAnswer|creator_answers|manageToken|manage_token_hash/)
  })

  it('returns a stable 404 for an unknown share code', async () => {
    getPublicTest.mockResolvedValue(null)

    const response = await GET(new Request('https://me.ly0688.online/api/tests/missing'), { params: Promise.resolve({ shareCode: 'missing' }) })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: { code: 'TEST_NOT_FOUND', message: '找不到这张测试卡。' } })
  })
})
