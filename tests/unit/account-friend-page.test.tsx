import {render,screen} from '@testing-library/react'
import {vi,it,expect,beforeEach} from 'vitest'
const mocks=vi.hoisted(()=>({user:vi.fn(),friend:vi.fn(),attempt:vi.fn()}))
vi.mock('@/lib/auth',()=>({requireUser:mocks.user}))
vi.mock('@/lib/repositories/accounts',()=>({getFriendTest:mocks.friend,getUserAttempt:mocks.attempt}))
vi.mock('@/components/account/AccountQuiz',()=>({AccountQuiz:()=> <div data-testid="quiz">quiz</div>}))
import FriendPage from '@/app/friend/[account]/page'
beforeEach(()=>{mocks.user.mockResolvedValue({id:'u',account:'00123456'});mocks.attempt.mockClear()})
it('does not mount quiz when replacement races with question loading',async()=>{
  mocks.friend.mockResolvedValue({nickname:'朋友',test:{testId:'old',questions:[]}})
  render(await FriendPage({params:Promise.resolve({account:'00123457'})}))
  expect(screen.getByRole('heading',{name:'测试已更新'})).toBeInTheDocument()
  expect(screen.queryByTestId('quiz')).not.toBeInTheDocument()
  expect(mocks.attempt).not.toHaveBeenCalled()
})
