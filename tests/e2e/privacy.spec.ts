import { site } from './helpers'
import { test, expect } from './fixtures'
test('anonymous users cannot read results or enter account pages through old links',async({page})=>{
  for(const path of ['/create','/friend','/leaderboard','/t/old-share','/manage/old-id']){
    await page.goto(site+path)
    await expect(page.getByLabel('8位数字账号')).toBeVisible()
  }
  const response=await page.request.get(site+'/api/results/10000000-0000-4000-8000-000000000001')
  expect(response.status()).toBe(401)
  for(const path of ['/api/tests/old-share','/api/manage/tests/old-id','/m/old-token','/api/og/results/old-id']){
    const retired=await page.request.get(site+path)
    expect(retired.status()).toBe(410)
    expect(await retired.text()).not.toContain('creatorAnswer')
  }
})
