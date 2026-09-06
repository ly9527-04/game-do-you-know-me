import { completeFriendQuiz, createTest, allAnswers } from './helpers'
import { expect, skipWithoutDatabase, test } from './fixtures'

test.describe('creator → friend → result → management loop', () => {
  skipWithoutDatabase()

  test('scores 19 matches, records one leaderboard entry, and offers own test creation', async ({ browser }) => {
    const creatorContext = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] })
    const creatorPage = await creatorContext.newPage()
    const creatorAnswers = allAnswers('A')
    const archive = await createTest(creatorPage, 'AD钙', creatorAnswers)

    await creatorPage.getByRole('button', { name: '复制朋友链接' }).click()
    await expect(creatorPage.getByRole('status', { name: '已复制朋友链接' })).toBeVisible()

    const friendContext = await browser.newContext()
    const friendPage = await friendContext.newPage()
    await completeFriendQuiz(friendPage, archive.shareUrl, '0011', [...allAnswers('A').slice(0, 19), ...allAnswers('B').slice(0, 6)])

    await expect(friendPage.getByRole('heading', { name: /76 分/ })).toBeVisible()
    const visibleMismatchCount = await friendPage.locator('.mismatch-card').count()
    await expect(visibleMismatchCount).toBeGreaterThanOrEqual(1)
    await expect(visibleMismatchCount).toBeLessThanOrEqual(3)

    await creatorPage.goto(archive.manageUrl)
    await expect(creatorPage.getByRole('heading', { name: 'AD钙的排行榜' })).toBeVisible()
    await expect(creatorPage.getByText('1 人挑战')).toBeVisible()
    await expect(creatorPage.getByText('平均 76 分')).toBeVisible()
    await expect(creatorPage.getByText('0011')).toBeVisible()
    await expect(creatorPage.getByText('76 分')).toBeVisible()

    await friendPage.getByRole('link', { name: '我也要创建自己的测试' }).click()
    await expect(friendPage).toHaveURL(/\/create$/)
    await creatorContext.close()
    await friendContext.close()
  })
})
