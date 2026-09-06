import { expect, type Page } from '@playwright/test'

export type AnswerChoice = 'A' | 'B' | 'C' | 'D'

export async function answerQuiz(page: Page, answers: AnswerChoice[]) {
  await expect(answers).toHaveLength(25)
  await answerQuestions(page, answers)
}

export async function answerQuestions(page: Page, answers: AnswerChoice[]) {
  for (const [index, answer] of answers.entries()) {
    const option = page.getByRole('button', { name: new RegExp(`^${answer}：`) })
    await expect(option).toBeVisible()
    await expect(option).toBeEnabled()
    await option.click()
    if (index < answers.length - 1) {
      await expect(page.locator('.quiz-progress__count')).toHaveText(`${String(index + 2).padStart(2, '0')} / 25`)
    }
  }
}

export async function createTest(page: Page, nickname: string, answers: AnswerChoice[]) {
  await page.goto('/create')
  await page.getByRole('textbox', { name: '你的昵称' }).fill(nickname)
  await page.getByRole('button', { name: '开始答题' }).click()
  await expect(page).toHaveURL(/\/create\/quiz\?nickname=/)
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/tests') && response.request().method() === 'POST')
  await answerQuiz(page, answers)
  const response = await responsePromise
  await expect(response.ok()).toBeTruthy()
  return await response.json() as { testId: string; shareUrl: string; manageUrl: string }
}

export async function completeFriendQuiz(page: Page, shareUrl: string, nickname: string, answers: AnswerChoice[]) {
  await page.goto(shareUrl)
  await expect(page.getByRole('heading', { name: /你正在猜/ })).toBeVisible()
  await page.getByRole('textbox', { name: '你的昵称' }).fill(nickname)
  await page.getByRole('button', { name: '开始猜' }).click()
  await expect(page).toHaveURL(/\/t\/.*\/quiz\?nickname=/)
  await answerQuiz(page, answers)
}

export function allAnswers(value: AnswerChoice): AnswerChoice[] {
  return Array.from({ length: 25 }, () => value)
}
