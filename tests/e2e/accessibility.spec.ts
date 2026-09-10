import { test,expect } from './fixtures'
test('320px login and registration support keyboard and avoid overflow',async({page})=>{
  await page.setViewportSize({width:320,height:700})
  await page.goto('/')
  const account=page.getByLabel('8位数字账号')
  await account.focus()
  await page.keyboard.type('00123456')
  await expect(account).toHaveValue('00123456')
  await page.getByRole('button',{name:'注册',exact:true}).click()
  await expect(page.getByLabel('确认密码',{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.getByRole('button',{name:'注册并进入'}).focus()
  expect(await page.getByRole('button',{name:'注册并进入'}).evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none')
})
