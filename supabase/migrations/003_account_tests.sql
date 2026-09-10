begin;

create table user_accounts (
  id uuid primary key default gen_random_uuid(),
  account text not null unique check (account ~ '^[0-9]{8}$'),
  nickname text not null check (char_length(trim(nickname)) between 1 and 20),
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table user_sessions (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references user_accounts(id) on delete cascade,
  expires_at timestamptz not null
);
create index user_sessions_user on user_sessions(user_id);
create index user_sessions_expiry on user_sessions(expires_at);
alter table user_accounts enable row level security;
alter table user_sessions enable row level security;
revoke all on user_accounts, user_sessions from anon, authenticated;
grant all on user_accounts, user_sessions to service_role;

-- Anonymous rows stay unclaimed. A nickname is not proof of ownership.
alter table tests add column owner_id uuid references user_accounts(id) on delete restrict;
create unique index tests_one_per_owner on tests(owner_id);
alter table attempts add column user_id uuid references user_accounts(id) on delete restrict;
create unique index attempts_one_per_user on attempts(test_id, user_id);

create function replace_account_test(
  p_user_id uuid, p_test_id uuid, p_previous_test_id uuid,
  p_question_set_id uuid, p_question_ids text[], p_answers jsonb,
  p_share_code text, p_manage_token_hash text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_nickname text;
  v_current uuid;
begin
  select nickname into v_nickname from user_accounts where id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  select id into v_current from tests where owner_id = p_user_id;
  -- Retrying a lost successful response must not recreate or clear the leaderboard.
  if v_current = p_test_id then return v_current; end if;
  if v_current is distinct from p_previous_test_id then raise exception 'TEST_CHANGED'; end if;
  if p_question_ids is null or cardinality(p_question_ids) <> 25
    or (select count(distinct id) from unnest(p_question_ids) q(id)) <> 25 then
    raise exception 'INVALID_SELECTION';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then raise exception 'INVALID_ANSWERS'; end if;
  if (select count(*) from jsonb_each(p_answers)) <> 25
    or exists (select 1 from jsonb_each(p_answers) a where jsonb_typeof(a.value) <> 'string' or a.value #>> '{}' not in ('A','B','C','D'))
    or (select count(*) from jsonb_each(p_answers) a join unnest(p_question_ids) q(id) on a.key = q.id) <> 25 then
    raise exception 'INVALID_ANSWERS';
  end if;
  if not exists (select 1 from question_sets where id = p_question_set_id and is_active)
    or (select count(*) from questions where question_set_id = p_question_set_id and id = any(p_question_ids)) <> 25 then
    raise exception 'INVALID_SELECTION';
  end if;

  -- This entire replacement rolls back if any subsequent insert fails.
  delete from attempts where test_id = v_current;
  delete from tests where id = v_current;
  insert into tests(id, question_set_id, nickname, share_code, manage_token_hash, owner_id)
  values(p_test_id, p_question_set_id, v_nickname, p_share_code, p_manage_token_hash, p_user_id);
  insert into test_questions(test_id, question_set_id, question_id, position)
  select p_test_id, p_question_set_id, q.id, q.position::smallint from unnest(p_question_ids) with ordinality q(id, position);
  insert into creator_answers(test_id, question_set_id, question_id, answer)
  select p_test_id, p_question_set_id, a.key, a.value::char(1) from jsonb_each_text(p_answers) a;
  return p_test_id;
end;
$$;

create function submit_account_attempt(p_user_id uuid, p_test_id uuid, p_answers jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_test tests%rowtype;
  v_nickname text;
  v_attempt uuid;
  v_score smallint;
begin
  select * into v_test from tests where id = p_test_id and owner_id is not null for update;
  if not found then raise exception 'TEST_CHANGED'; end if;
  if v_test.owner_id = p_user_id then raise exception 'OWN_TEST'; end if;
  select nickname into v_nickname from user_accounts where id = p_user_id;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  select id into v_attempt from attempts where test_id = p_test_id and user_id = p_user_id;
  if found then return v_attempt; end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then raise exception 'INVALID_ANSWERS'; end if;
  if (select count(*) from jsonb_each(p_answers)) <> 25
    or exists (select 1 from jsonb_each(p_answers) a where jsonb_typeof(a.value) <> 'string' or a.value #>> '{}' not in ('A','B','C','D'))
    or (select count(*) from test_questions tq join jsonb_each(p_answers) a on a.key = tq.question_id where tq.test_id = p_test_id) <> 25 then
    raise exception 'INVALID_ANSWERS';
  end if;
  select (count(*) * 4)::smallint into v_score from creator_answers ca
    join jsonb_each_text(p_answers) a on a.key = ca.question_id and a.value = ca.answer
    where ca.test_id = p_test_id;
  v_attempt := gen_random_uuid();
  insert into attempts(id, test_id, question_set_id, nickname, score, idempotency_key, user_id)
  values(v_attempt, p_test_id, v_test.question_set_id, v_nickname, v_score, gen_random_uuid(), p_user_id);
  insert into attempt_answers(attempt_id, question_set_id, question_id, answer, is_correct)
  select v_attempt, v_test.question_set_id, a.key, a.value, a.value = ca.answer
    from jsonb_each_text(p_answers) a join creator_answers ca on ca.test_id = p_test_id and ca.question_id = a.key;
  return v_attempt;
end;
$$;
revoke execute on function replace_account_test(uuid,uuid,uuid,uuid,text[],jsonb,text,text) from public, anon, authenticated;
revoke execute on function submit_account_attempt(uuid,uuid,jsonb) from public, anon, authenticated;
grant execute on function replace_account_test(uuid,uuid,uuid,uuid,text[],jsonb,text,text) to service_role;
grant execute on function submit_account_attempt(uuid,uuid,jsonb) to service_role;
commit;
