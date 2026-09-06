import { expect, test } from './fixtures'

test('320px creator quiz stays keyboard accessible and avoids horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/create')
  await page.getByRole('textbox', { name: '你的昵称' }).fill('键盘测试')
  await page.getByRole('button', { name: '开始答题' }).click()
  await expect(page.locator('.quiz-progress__count')).toHaveText('01 / 25')
  await expect(page.getByRole('button', { name: /^[A-D]：/ })).toHaveCount(4)

  const firstOption = page.getByRole('button', { name: /^A：/ })
  await firstOption.focus()
  await page.keyboard.press('Enter')
  await expect(firstOption).toHaveAttribute('aria-pressed', 'true')
  const outlineStyle = await firstOption.evaluate((element) => getComputedStyle(element).outlineStyle)
  await expect(outlineStyle).not.toBe('none')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  await expect(overflow).toBeLessThanOrEqual(0)
})
