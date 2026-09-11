// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { randomUUID, randomBytes } from 'node:crypto'
import { beforeAll, afterAll, it, expect } from 'vitest'
import { QUESTION_POOL } from '@/lib/questions'
let db: PGlite
const v2SetId = '00000000-0000-4000-8000-000000000002'
const setId = '00000000-0000-4000-8000-000000000003'
const legacyOwnerId = '10000000-0000-4000-8000-000000000001'
const legacyTestId = '20000000-0000-4000-8000-000000000001'
const ids = Array.from({length:25}, (_,i) => 'q' + String(i+1).padStart(2,'0'))
const answers = Object.fromEntries(ids.map(id => [id,'A']))
let nextAccount = 100
beforeAll(async () => {
  db = new PGlite()
  await db.exec('create role anon; create role authenticated; create role service_role bypassrls;')
  for (const path of ['supabase/migrations/001_initial_schema.sql','supabase/migrations/002_random_question_pool.sql','supabase/migrations/003_account_tests.sql']) await db.exec(readFileSync(path,'utf8'))
  await db.query('insert into user_accounts(id,account,nickname,password_hash) values($1,$2,$3,$4)', [legacyOwnerId,'00000001','旧测试主人','test-only-hash'])
  await db.query('insert into tests(id,question_set_id,nickname,share_code,manage_token_hash,owner_id) values($1,$2,$3,$4,$5,$6)', [legacyTestId,v2SetId,'旧测试主人','legacy-v2-code','a'.repeat(64),legacyOwnerId])
  await db.query(`
    insert into test_questions(test_id, question_set_id, question_id, position)
    select $1, $2, id, row_number() over (order by sort_order) from questions
    where question_set_id = $2 and sort_order between 26 and 50
  `, [legacyTestId,v2SetId])
  for (const path of ['supabase/migrations/004_question_bank_v3.sql','supabase/seed.sql']) await db.exec(readFileSync(path,'utf8'))
}, 60000)
afterAll(async () => { await db?.close() })
async function user() {
  const id = randomUUID(), account = String(nextAccount++).padStart(8,'0')
  await db.query('insert into user_accounts(id,account,nickname,password_hash) values($1,$2,$3,$4)', [id,account,'测试名字','test-only-hash'])
  return id
}
async function create(owner: string, previous: string | null = null, options: {id?:string;ids?:string[];answers?:unknown;share?:string} = {}) {
  const id = options.id ?? randomUUID()
  const result = await db.query<{id:string}>('select replace_account_test($1,$2,$3,$4,$5,$6,$7,$8) as id', [owner,id,previous,setId,options.ids ?? ids,options.answers ?? answers,options.share ?? randomBytes(8).toString('hex'),randomBytes(32).toString('hex')])
  return result.rows[0].id
}
async function attempt(friend: string, test: string, value: unknown = answers) {
  const result = await db.query<{id:string}>('select submit_account_attempt($1,$2,$3) as id',[friend,test,value])
  return result.rows[0].id
}
it('activates v3 with 120 exact questions while preserving v2 tests', async () => {
  const sets = await db.query<{version:number;is_active:boolean;questions:number}>(`
    select version, is_active, count(q.id)::int as questions
    from question_sets s join questions q on q.question_set_id=s.id
    group by version, is_active order by version
  `)
  expect(sets.rows).toEqual(expect.arrayContaining([
    { version: 2, is_active: false, questions: 75 },
    { version: 3, is_active: true, questions: 120 },
  ]))

  const legacy = await db.query<{question_set_id:string}>('select question_set_id from tests where id=$1', [legacyTestId])
  expect(legacy.rows[0].question_set_id).toBe(v2SetId)
  expect((await db.query('select question_id from test_questions where test_id=$1', [legacyTestId])).rows).toHaveLength(25)

  const v3Rows = await db.query<{id:string;sort_order:number;prompt:string;options:{value:string;text:string}[];pool_group:string;mismatch_priority:number}>(`
    select id, sort_order, prompt, options, pool_group, mismatch_priority
    from questions where question_set_id=$1 and sort_order >= 76 order by sort_order
  `, [setId])
  expect(v3Rows.rows).toEqual(QUESTION_POOL.slice(75).map(question => ({
    id: question.id,
    sort_order: question.order,
    prompt: question.prompt,
    options: question.options.map(option => ({ ...option })),
    pool_group: question.poolGroup,
    mismatch_priority: question.mismatchPriority,
  })))
})
it('preserves leading zero accounts and rejects duplicates and non-eight digits', async () => {
  await db.query("insert into user_accounts(account,nickname,password_hash) values('00123456','甲','test')")
  expect((await db.query<{account:string}>("select account from user_accounts where account='00123456'")).rows[0].account).toBe('00123456')
  await expect(db.query("insert into user_accounts(account,nickname,password_hash) values('00123456','乙','test')")).rejects.toThrow()
  await expect(db.query("insert into user_accounts(account,nickname,password_hash) values('1234567','乙','test')")).rejects.toThrow()
})
it('accepts free selection with no category quota and stores exact order', async () => {
  const owner = await user(), reverse = [...ids].reverse()
  const id = await create(owner,null,{ids:reverse})
  const rows = await db.query<{question_id:string}>('select question_id from test_questions where test_id=$1 order by position',[id])
  expect(rows.rows.map(q=>q.question_id)).toEqual(reverse)
})
it('scores on database and returns existing attempt unchanged on repeat', async () => {
  const owner = await user(), friend = await user(), id = await create(owner)
  const wrong = {...answers, q01:'B',q02:'D'}
  const first = await attempt(friend,id,wrong)
  expect(await attempt(friend,id,answers)).toBe(first)
  const row = (await db.query<{score:number}>('select score from attempts where id=$1',[first])).rows[0]
  expect(row.score).toBe(92)
  expect((await db.query('select * from attempt_answers where attempt_id=$1',[first])).rows).toHaveLength(25)
})
it('rejects self challenge and malformed answers', async () => {
  const owner=await user(), friend=await user(), id=await create(owner)
  await expect(attempt(owner,id)).rejects.toThrow('OWN_TEST')
  await expect(attempt(friend,id,{q01:'A'})).rejects.toThrow('INVALID_ANSWERS')
  await expect(attempt(friend,id,{...answers,q01:'Z'})).rejects.toThrow('INVALID_ANSWERS')
  await expect(attempt(friend,id,{...answers,q01:null})).rejects.toThrow('INVALID_ANSWERS')
})
it('replaces only the owners previous test and deletes its answers and leaderboard', async () => {
  const owner=await user(), friend=await user(), unrelated=await user()
  const old=await create(owner), other=await create(unrelated)
  const oldAttempt=await attempt(friend,old)
  const next=await create(owner,old)
  expect(next).not.toBe(old)
  expect((await db.query('select * from tests where id=$1',[old])).rows).toHaveLength(0)
  expect((await db.query('select * from attempts where id=$1',[oldAttempt])).rows).toHaveLength(0)
  expect((await db.query('select * from attempt_answers where attempt_id=$1',[oldAttempt])).rows).toHaveLength(0)
  expect((await db.query('select * from tests where id=$1',[other])).rows).toHaveLength(1)
  expect(await attempt(friend,next)).toBeTruthy()
  await expect(attempt(friend,old)).rejects.toThrow('TEST_CHANGED')
})
it('rejects stale overwrite and retries creation without clearing new scores', async () => {
  const owner=await user(),friend=await user(),old=await create(owner),next=await create(owner,old)
  const result=await attempt(friend,next)
  await expect(create(owner,old)).rejects.toThrow('TEST_CHANGED')
  expect(await create(owner,old,{id:next})).toBe(next)
  expect((await db.query('select * from attempts where id=$1',[result])).rows).toHaveLength(1)
})
it('rolls back deletion if replacement insert fails', async () => {
  const owner=await user(),friend=await user(),other=await user()
  const old=await create(owner),originalAttempt=await attempt(friend,old)
  await create(other,null,{share:'collision-code'})
  await expect(create(owner,old,{share:'collision-code'})).rejects.toThrow()
  expect((await db.query('select * from tests where id=$1',[old])).rows).toHaveLength(1)
  expect((await db.query('select * from attempts where id=$1',[originalAttempt])).rows).toHaveLength(1)
})
it('rejects duplicate, unknown and null selected answers before replacing old data', async () => {
  const owner=await user(),old=await create(owner)
  await expect(create(owner,old,{ids:Array(25).fill('q01')})).rejects.toThrow('INVALID_SELECTION')
  await expect(create(owner,old,{ids:[...ids.slice(0,24),'q999']})).rejects.toThrow()
  await expect(create(owner,old,{answers:{...answers,q01:null}})).rejects.toThrow('INVALID_ANSWERS')
  expect((await db.query('select * from tests where id=$1',[old])).rows).toHaveLength(1)
})
it('does not grant browser roles access to accounts, sessions or mutation RPCs', async () => {
  const {rows}=await db.query<{read:boolean;session:boolean;write:boolean}>("select has_table_privilege('anon','user_accounts','SELECT') as read, has_table_privilege('authenticated','user_sessions','SELECT') as session, has_function_privilege('authenticated','submit_account_attempt(uuid,uuid,jsonb)','EXECUTE') as write")
  expect(rows[0]).toEqual({read:false,session:false,write:false})
})
