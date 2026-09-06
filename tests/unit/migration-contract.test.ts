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

  it('enables RLS on every core table without client allow policies', () => {
    for (const table of [
      'question_sets', 'questions', 'tests', 'creator_answers',
      'attempts', 'attempt_answers', 'analytics_events', 'rate_limits',
    ]) {
      expect(migration).toMatch(new RegExp(`alter table ${table} enable row level security`, 'i'))
    }
    expect(migration).not.toMatch(/create policy/i)
    expect(migration).not.toMatch(/\b(?:anon|authenticated)\b/i)
  })

  it('defines three security-definer transactional RPCs with input guards', () => {
    for (const rpc of ['create_test', 'create_attempt', 'check_rate_limit']) {
      expect(migration).toMatch(new RegExp(`create or replace function ${rpc}\\b`, 'i'))
    }
    expect(migration).toMatch(/jsonb_object_length\(p_answers\) <> 25/i)
    expect(migration).toMatch(/on conflict \(test_id, idempotency_key\)/i)
    expect(migration).toMatch(/on conflict \(key_hash, action\) do update/i)
    expect(migration.match(/security definer/gi)).toHaveLength(3)
  })

  it('seeds the fixed version-one q01-q25 bank idempotently', () => {
    expect(seed).toMatch(/version[^;]+1/i)
    expect(seed).toMatch(/on conflict \(version\) do update/i)
    expect(seed).toMatch(/on conflict \(id\) do update/i)
    for (let order = 1; order <= 25; order += 1) {
      expect(seed).toContain(`q${String(order).padStart(2, '0')}`)
    }
    for (const question of QUESTIONS) {
      expect(seed).toContain(question.prompt)
      for (const option of question.options) expect(seed).toContain(option.text)
    }
  })
})
