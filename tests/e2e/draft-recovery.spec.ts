import { createTest, allAnswers, answerQuestions, answerQuiz, completeFriendQuiz } from './helpers'
import { expect, skipWithoutDatabase, test } from './fixtures'

test.describe('draft recovery and idempotent retry', () => {
  skipWithoutDatabase()

  test('resumes at question 08 and does not duplicate a lost-response submission', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/create')
    await page.getByRole('textbox', { name: '你的昵称' }).fill('恢复测试')
    await page.getByRole('button', { name: '开始答题' }).click()
    await expect(page).toHaveURL(/\/create\/quiz\?nickname=/)
    await answerQuestions(page, allAnswers('A').slice(0, 7))
    await page.goto('/')
    await expect(page.getByText('继续上次进度')).toBeVisible()
    await page.getByRole('link', { name: '继续上次进度' }).click()
    await expect(page.locator('.quiz-progress__count')).toHaveText('08 / 25')

    const archive = await createTest(page, '幂等测试', allAnswers('A'))
    const friendPage = await context.newPage()
    let firstAttempt = true
    await friendPage.route('**/api/tests/*/attempts', async (route) => {
      if (!firstAttempt) return route.continue()
      firstAttempt = false
      const response = await route.fetch()
      await expect(response.ok()).toBeTruthy()
      await route.abort()
    })
    await completeFriendQuiz(friendPage, archive.shareUrl, '0011', allAnswers('A'))
    await expect(friendPage.getByRole('alert')).toBeVisible()
    await friendPage.getByRole('button', { name: '重新提交' }).click()
    await answerQuiz(friendPage, allAnswers('A'))
    await friendPage.unroute('**/api/tests/*/attempts')

    await page.goto(archive.manageUrl)
    await expect(page.getByText('1 人挑战')).toBeVisible()
    await context.close()
  })
})
