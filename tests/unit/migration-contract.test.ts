import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { QUESTION_POOL, QUESTIONS } from '@/lib/questions'

const migration = readFileSync(resolve('supabase/migrations/001_initial_schema.sql'), 'utf8')
const poolMigration = readFileSync(resolve('supabase/migrations/002_random_question_pool.sql'), 'utf8')
const v3MigrationPath = resolve('supabase/migrations/004_question_bank_v3.sql')
const v3Migration = existsSync(v3MigrationPath) ? readFileSync(v3MigrationPath, 'utf8') : ''
const seed = readFileSync(resolve('supabase/seed.sql'), 'utf8')

describe('Supabase migration contract', () => {
  it('creates all eight required tables', () => {
    for (const table of [
      'question_sets', 'questions', 'tests', 'creator_answers',
      'attempts', 'attempt_answers', 'analytics_events', 'rate_limits',
    ]) {
      expect(migration).toMatch(new RegExp(`create table(?: if not exists)? ${table}\\b`, 'i'))
    }
  })

  it('enforces score, answer, ordering and idempotency constraints', () => {
    expect(migration).toMatch(/constraint valid_score\s+check \(score between 0 and 100 and score % 4 = 0\)/i)
    expect(migration).toMatch(/constraint creator_answer_choice\s+check \(answer in \('A', 'B', 'C', 'D'\)\)/i)
    expect(migration).toMatch(/create unique index attempts_idempotency\s+on attempts\(test_id, idempotency_key\)/i)
    expect(migration).toMatch(/create unique index questions_order_per_set\s+on questions\(question_set_id, sort_order\)/i)
  })

  it('scopes question identities and persisted answers to a question-set version', () => {
    expect(migration).toMatch(/primary key \(question_set_id, id\)/i)
    expect(migration).toMatch(/foreign key \(test_id, question_set_id\)\s+references tests\(id, question_set_id\)/i)
    expect(migration).toMatch(/foreign key \(attempt_id, question_set_id\)\s+references attempts\(id, question_set_id\)/i)
    expect(migration.match(/foreign key \(question_set_id, question_id\)\s+references questions\(question_set_id, id\)/gi)).toHaveLength(2)
    expect(seed).toMatch(/on conflict \(question_set_id, id\) do update/i)
  })

  it('enables RLS on every core table without client allow policies', () => {
    for (const table of [
      'question_sets', 'questions', 'tests', 'creator_answers',
      'attempts', 'attempt_answers', 'analytics_events', 'rate_limits',
    ]) {
      expect(migration).toMatch(new RegExp(`alter table ${table} enable row level security`, 'i'))
    }
    expect(migration).not.toMatch(/create policy/i)
  })

  it('defines security-definer transactional RPCs with input guards', () => {
    for (const rpc of ['create_test', 'create_attempt', 'check_rate_limit']) {
      expect(migration).toMatch(new RegExp(`create or replace function ${rpc}\\b`, 'i'))
    }
    expect(migration).toMatch(/jsonb_typeof\(p_answers\) <> 'object'/i)
    expect(migration).toMatch(/select count\(\*\) from jsonb_each\(p_answers\)[\s\S]*<> 25/i)
    expect(migration).toMatch(/on conflict \(test_id, idempotency_key\)/i)
    expect(migration).toMatch(/on conflict \(key_hash, action\) do update/i)
    expect(migration.match(/security definer/gi)).toHaveLength(4)
    for (const rpc of ['create_test', 'create_attempt', 'check_rate_limit']) {
      expect(migration).toMatch(new RegExp(`revoke execute on function ${rpc}\\([^;]+\\) from public, anon, authenticated;`, 'i'))
      expect(migration).toMatch(new RegExp(`grant execute on function ${rpc}\\([^;]+\\) to service_role;`, 'i'))
    }
  })

  it('defines an aggregated management stats RPC', () => {
    expect(migration).toMatch(/create or replace function get_manage_stats\b/i)
    expect(migration).toMatch(/count\(\*\)[\s\S]*avg\(score\)/i)
    expect(migration).toMatch(/revoke execute on function get_manage_stats\([^;]+\) from public, anon, authenticated;/i)
    expect(migration).toMatch(/grant execute on function get_manage_stats\([^;]+\) to service_role;/i)
  })

  it('seeds the fixed version-one q01-q25 bank idempotently', () => {
    expect(seed).toMatch(/version[^;]+1/i)
    expect(seed).toMatch(/on conflict \(version\) do update/i)
    expect(seed).toMatch(/on conflict \(question_set_id, id\) do update/i)
    for (let order = 1; order <= 25; order += 1) {
      expect(seed).toContain(`q${String(order).padStart(2, '0')}`)
    }
    for (const question of QUESTIONS) {
      expect(seed).toContain(question.prompt)
      for (const option of question.options) expect(seed).toContain(option.text)
    }
  })
})

describe('random question pool migration contract', () => {
  it('adds pool groups and the per-test ordered question table', () => {
    expect(poolMigration).toMatch(/add column(?: if not exists)? pool_group text/i)
    expect(poolMigration).toMatch(/create table(?: if not exists)? test_questions\b/i)
    expect(poolMigration).toMatch(/unique \(test_id, position\)/i)
    expect(poolMigration).toMatch(/foreign key \(question_set_id, question_id\)\s+references questions\(question_set_id, id\)/i)
    expect(poolMigration).toMatch(/alter table test_questions enable row level security/i)
  })

  it('backfills the classic 25 questions for existing tests', () => {
    expect(poolMigration).toMatch(/insert into test_questions[\s\S]+from tests t[\s\S]+join questions q[\s\S]+on conflict/i)
  })

  it('creates a version-two 75-question bank and activates it last', () => {
    expect(poolMigration).toMatch(/values \('00000000-0000-4000-8000-000000000002', 2, false\)/i)
    for (const question of QUESTION_POOL.slice(25, 75)) {
      expect(poolMigration).toContain(question.id)
      expect(poolMigration).toContain(question.prompt)
      for (const option of question.options) expect(poolMigration).toContain(option.text)
    }
    expect(poolMigration).toMatch(/update question_sets set is_active = false;[\s\S]*update question_sets set is_active = true where version = 2;\s*(?:commit;)?\s*$/i)
  })

  it('validates and stores the balanced selected ids in create_test', () => {
    expect(poolMigration).toMatch(/create or replace function create_test\([\s\S]*p_question_ids text\[\]/i)
    expect(poolMigration).toMatch(/cardinality\(p_question_ids\) <> 25/i)
    expect(poolMigration).toMatch(/count\(distinct id\)[\s\S]*unnest\(p_question_ids\)/i)
    for (const quota of ["'classic' then 5", "'daily' then 4", "'personality' then 4", "'scenario' then 4", "'relationship' then 4", "'roast' then 4"]) {
      expect(poolMigration).toContain(quota)
    }
    expect(poolMigration).toMatch(/insert into test_questions[\s\S]*with ordinality/i)
  })

  it('validates attempts against test_questions and locks RPC permissions', () => {
    expect(poolMigration).toMatch(/create or replace function create_attempt[\s\S]*(?:from|join) test_questions tq/i)
    expect(poolMigration).toMatch(/revoke execute on function create_test\(uuid, uuid, text, text, text, text\[\], jsonb\) from public, anon, authenticated;/i)
    expect(poolMigration).toMatch(/grant execute on function create_test\(uuid, uuid, text, text, text, text\[\], jsonb\) to service_role;/i)
  })

  it('keeps an idempotent seed contract containing q01 through q75', () => {
    expect(seed).toMatch(/version[^;]+2/i)
    for (let order = 1; order <= 75; order += 1) {
      expect(seed).toContain(`q${String(order).padStart(2, '0')}`)
    }
  })
})

describe('version three question bank migration contract', () => {
  it('creates and activates a complete immutable version-three bank', () => {
    expect(v3Migration).toContain('00000000-0000-4000-8000-000000000003')
    expect(v3Migration).toMatch(/version[^;]*3/i)
    for (let order = 76; order <= 120; order += 1) {
      expect(v3Migration).toContain(`'q${order}'`)
    }
    expect(v3Migration).toMatch(/count\(\*\)[\s\S]*<> 120/i)
    expect(v3Migration).toMatch(/update question_sets set is_active = false/i)
    expect(v3Migration).toMatch(/update question_sets set is_active = true where version = 3/i)
  })

  it('keeps seed initialization on version three after all migrations', () => {
    expect(seed).toMatch(/version = 3/i)
    expect(seed).toMatch(/actual_count <> 120/i)
  })
})
