import { register,createTest,answerQuestions,allAnswers,site } from './helpers'
import { test, expect, skipWithoutDatabase } from './fixtures'
test.describe('account creator and friend loop',()=>{
  skipWithoutDatabase()
  test('account discovery, full differences, once-only score and replacement warning',async({browser})=>{
    const creator=await browser.newContext(), friend=await browser.newContext()
    try{
      const owner=await creator.newPage(), guest=await friend.newPage()
      const account=await register(owner,'创建者')
      await createTest(owner)
      await register(guest,'朋友')
      await guest.getByRole('link',{name:'做朋友的测试'}).click()
      await guest.getByLabel('朋友的8位数字账号').fill(account)
      await guest.getByRole('button',{name:'查找朋友的测试'}).click()
      await answerQuestions(guest,[...allAnswers('A').slice(0,19),...allAnswers('B').slice(0,6)])
      await expect(guest).toHaveURL(/\/r\//)
      await expect(guest.getByRole('article')).toHaveCount(3)
      await guest.getByRole('button',{name:/查看更多/}).click()
      await expect(guest.getByRole('article')).toHaveCount(6)
      await guest.goto(site+'/friend/'+account)
      await expect(guest.getByRole('link',{name:'查看我的结果'})).toBeVisible()
      await owner.goto(site+'/leaderboard')
      await expect(owner.getByText('1 人挑战')).toBeVisible()
      await expect(owner.getByText('平均 76 分')).toBeVisible()
      await owner.goto(site+'/create')
      await expect(owner.getByText('旧测试和排行榜将被清空')).toBeVisible()
      await owner.getByRole('link',{name:'取消，保留旧测试'}).click()
      await owner.goto(site+'/leaderboard')
      await expect(owner.getByText('1 人挑战')).toBeVisible()
    }finally{await creator.close();await friend.close()}
  })
})
