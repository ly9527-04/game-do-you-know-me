import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import { QUESTIONS } from '@/lib/questions'

const migration = readFileSync(resolve('supabase/migrations/001_initial_schema.sql'), 'utf8')
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
