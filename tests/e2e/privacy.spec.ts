import { createTest, allAnswers } from './helpers'
import { expect, skipWithoutDatabase, test } from './fixtures'

test.describe('privacy boundaries', () => {
  skipWithoutDatabase()

  test('public test payload and result fallback do not expose creator answers', async ({ page }) => {
    const archive = await createTest(page, '隐私测试', allAnswers('A'))
    const shareCode = new URL(archive.shareUrl).pathname.split('/').pop()!
    const response = await page.request.get(`/api/tests/${shareCode}`)
    const body = await response.text()
    await expect(response.ok()).toBeTruthy()
    await expect(body).not.toContain('creatorAnswer')
    await expect(body).not.toContain('creator_answers')

    await page.goto('/r/10000000-0000-4000-8000-000000000099')
    await expect(page.getByText(/结果暂时打不开|找不到这次挑战/)).toBeVisible()
  })

  test('a management cookie for test A cannot read test B', async ({ page }) => {
    const testA = await createTest(page, '测试A', allAnswers('A'))
    const testB = await createTest(page, '测试B', allAnswers('B'))
    await page.goto(testA.manageUrl)
    await page.goto(`/manage/${testB.testId}`)
    await expect(page.getByRole('heading', { name: '这个管理链接无效或已失效' })).toBeVisible()
  })
})
