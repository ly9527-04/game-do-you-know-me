import { describe, expect, it } from 'vitest'
import CreatorQuizPage from '@/app/create/quiz/page'

describe('CreatorQuizPage', () => {
  it('accepts the nickname through server search params without client search-param hooks', async () => {
    const element = await CreatorQuizPage({ searchParams: Promise.resolve({ nickname: '阿钙' }) })

    expect(element).toBeTruthy()
  })
})
