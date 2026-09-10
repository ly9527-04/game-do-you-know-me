import { vi, beforeEach, it, expect } from 'vitest'
const mocks = vi.hoisted(() => ({ user: vi.fn(), origin: vi.fn(), rate: vi.fn(), active: vi.fn(), replace: vi.fn(), submit: vi.fn() }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: mocks.user, assertSameOrigin: mocks.origin }))
vi.mock('@/lib/rate-limit', () => ({ assertRateLimit: mocks.rate, RateLimitError: class extends Error {} }))
vi.mock('@/lib/repositories/tests', () => ({ getActiveQuestionSet: mocks.active }))
vi.mock('@/lib/repositories/accounts', () => ({ replaceAccountTest: mocks.replace, submitAccountAttempt: mocks.submit, AccountTestError: class extends Error {} }))
import { POST as create } from '@/app/api/account/tests/route'
import { POST as attempt } from '@/app/api/account/attempts/route'
import { QUESTION_POOL } from '@/lib/questions'
const testId='10000000-0000-4000-8000-000000000001', questionSetId='20000000-0000-4000-8000-000000000001'
const ids=QUESTION_POOL.slice(0,25).map(q=>q.id), answers=Object.fromEntries(ids.map(id=>[id,'A']))
const expectedUserId='40000000-0000-4000-8000-000000000001'
const body={expectedUserId,testId, previousTestId:null, questionSetId,questionIds:ids,answers}
function request(value: unknown) { return new Request('https://me.ly0688.online/api/account/tests',{method:'POST',headers:{'content-type':'application/json',origin:'https://me.ly0688.online'},body:JSON.stringify(value)}) }
beforeEach(()=> {
  vi.clearAllMocks(); mocks.origin.mockReset(); mocks.user.mockResolvedValue({id:expectedUserId,nickname:'明'}); mocks.rate.mockResolvedValue(undefined)
  mocks.active.mockResolvedValue({id:questionSetId,questions:QUESTION_POOL}); mocks.replace.mockResolvedValue(testId); mocks.submit.mockResolvedValue('attempt')
})
it('requires login to create and submit',async()=>{
  mocks.user.mockResolvedValue(null)
  expect((await create(request(body))).status).toBe(401)
  expect((await attempt(request({testId,answers}))).status).toBe(401)
  expect(mocks.replace).not.toHaveBeenCalled(); expect(mocks.submit).not.toHaveBeenCalled()
})
it('allows arbitrary category quotas and derives owner from session',async()=>{
  expect((await create(request(body))).status).toBe(200)
  expect(mocks.replace).toHaveBeenCalledWith({...body,userId:expectedUserId})
})
it('rejects duplicate ids, spoofed owner, missing answers and stale bank',async()=>{
  for(const value of [{...body,questionIds:ids.map(()=>ids[0])},{...body,userId:'victim'},{...body,answers:{q01:'A'}}]) expect((await create(request(value))).status).toBe(400)
  mocks.active.mockResolvedValue({id:'new-bank',questions:QUESTION_POOL})
  expect((await create(request(body))).status).toBe(409)
  expect(mocks.replace).not.toHaveBeenCalled()
})
it('rejects cross origin before data access',async()=>{
  mocks.origin.mockImplementation(()=>{throw new Error('origin')})
  expect((await create(request(body))).status).toBe(403)
  expect(mocks.user).not.toHaveBeenCalled()
})
it('submits answers using session identity and no client score',async()=>{
  expect((await attempt(request({expectedUserId,testId,answers}))).status).toBe(200)
  expect(mocks.submit).toHaveBeenCalledWith(expectedUserId,testId,answers)
  expect((await attempt(request({expectedUserId,testId,answers,score:100}))).status).toBe(400)
})
it('rejects an old tab after another tab changes the signed-in account',async()=>{
  mocks.user.mockResolvedValue({id:'40000000-0000-4000-8000-000000000002'})
  expect((await create(request(body))).status).toBe(409)
  expect((await attempt(request({expectedUserId,testId,answers}))).status).toBe(409)
  expect(mocks.replace).not.toHaveBeenCalled()
  expect(mocks.submit).not.toHaveBeenCalled()
})
