import { expect, type Page } from '@playwright/test'
import { randomInt } from 'node:crypto'
export type AnswerChoice = 'A' | 'B' | 'C' | 'D'
export const site = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000'
export async function register(page: Page, nickname: string) {
  const account = String(randomInt(0,100000000)).padStart(8,'0')
  await page.goto(site)
  await page.getByRole('button',{name:'注册',exact:true}).click()
  await page.getByLabel('你的名字',{exact:true}).fill(nickname)
  await page.getByLabel('8位数字账号',{exact:true}).fill(account)
  await page.getByLabel('密码',{exact:true}).fill('E2E-test-only-1234')
  await page.getByLabel('确认密码',{exact:true}).fill('E2E-test-only-1234')
  await page.getByRole('button',{name:'注册并进入'}).click()
  await expect(page.getByRole('link',{name:'做朋友的测试'})).toBeVisible()
  return account
}
export async function selectQuestions(page: Page) {
  await page.goto(site+'/create')
  const confirm = page.getByRole('button',{name:'确认，继续创建'})
  if(await confirm.isVisible()) await confirm.click()
  await page.getByRole('button',{name:/抽象与想象/}).click()
  for(const box of await page.getByRole('checkbox').all()) await box.check()
  await page.getByRole('button',{name:'返回分类'}).click()
  await page.getByRole('button',{name:/内心与关系/}).click()
  for(const box of await page.getByRole('checkbox').all()) await box.check()
  await page.getByRole('button',{name:'选好了，开始回答'}).click()
}
export async function answerQuestions(page: Page, answers: AnswerChoice[], start=0) {
  for(const [index,answer] of answers.entries()){
    await expect(page.locator('.quiz-progress__count')).toHaveText(String(start+index+1).padStart(2,'0')+' / 25')
    await page.getByRole('button',{name:new RegExp('^'+answer+'：')}).click()
  }
}
export async function createTest(page: Page) {
  await selectQuestions(page)
  await answerQuestions(page,allAnswers('A'))
  await expect(page.getByRole('heading',{name:'谁最懂你，等朋友来揭晓'})).toBeVisible()
}
export function allAnswers(answer: AnswerChoice): AnswerChoice[] { return Array.from({length:25},()=>answer) }
