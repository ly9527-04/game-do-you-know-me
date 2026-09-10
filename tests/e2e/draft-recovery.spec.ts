import { register,selectQuestions,answerQuestions,allAnswers,site } from './helpers'
import { test, expect, skipWithoutDatabase } from './fixtures'
test.describe('account draft recovery',()=>{
  skipWithoutDatabase()
  test('restores selected questions and answers after refresh, retains answers after lost response',async({page})=>{
    await register(page,'恢复测试')
    await selectQuestions(page)
    await answerQuestions(page,allAnswers('A').slice(0,7))
    await page.reload()
    await expect(page.locator('.quiz-progress__count')).toHaveText('08 / 25')
    let lost=true
    await page.route('**/api/account/tests',async route=>{
      if(!lost)return route.continue()
      lost=false
      const response=await route.fetch()
      expect(response.ok()).toBeTruthy()
      await route.abort()
    })
    await answerQuestions(page,allAnswers('A').slice(7),7)
    await expect(page.getByRole('alert')).toBeVisible()
    await page.getByRole('button',{name:'重试提交'}).click()
    await expect(page.getByRole('heading',{name:'谁最懂你，等朋友来揭晓'})).toBeVisible()
    await page.goto(site+'/leaderboard')
    await expect(page.getByText('0 人挑战')).toBeVisible()
  })
})
