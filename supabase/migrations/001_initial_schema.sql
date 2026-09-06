create table if not exists question_sets (
  id uuid primary key,
  version integer not null unique check (version > 0),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists questions (
  id text not null,
  question_set_id uuid not null references question_sets(id) on delete restrict,
  sort_order smallint not null check (sort_order between 1 and 25),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4),
  category text not null check (category in ('abstract', 'semi_abstract', 'real_anchor')),
  mismatch_priority smallint not null check (mismatch_priority between 1 and 3),
  primary key (question_set_id, id)
);

create unique index questions_order_per_set
  on questions(question_set_id, sort_order);

create table if not exists tests (
  id uuid primary key,
  question_set_id uuid not null references question_sets(id) on delete restrict,
  nickname varchar(20) not null check (length(trim(nickname)) between 1 and 20),
  share_code varchar(32) not null unique,
  manage_token_hash text not null unique check (manage_token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (id, question_set_id)
);

create table if not exists creator_answers (
  test_id uuid not null,
  question_set_id uuid not null,
  question_id text not null,
  answer char(1) not null,
  primary key (test_id, question_id),
  foreign key (test_id, question_set_id)
    references tests(id, question_set_id) on delete cascade,
  foreign key (question_set_id, question_id)
    references questions(question_set_id, id) on delete restrict
);

alter table creator_answers add constraint creator_answer_choice
  check (answer in ('A', 'B', 'C', 'D'));

create table if not exists attempts (
  id uuid primary key,
  test_id uuid not null,
  question_set_id uuid not null,
  nickname varchar(20) not null check (length(trim(nickname)) between 1 and 20),
  score smallint not null,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (id, question_set_id),
  foreign key (test_id, question_set_id)
    references tests(id, question_set_id) on delete cascade
);

alter table attempts add constraint valid_score
  check (score between 0 and 100 and score % 4 = 0);

create unique index attempts_idempotency
  on attempts(test_id, idempotency_key);
create index attempts_leaderboard
  on attempts(test_id, score desc, created_at asc);

create table if not exists attempt_answers (
  attempt_id uuid not null,
  question_set_id uuid not null,
  question_id text not null,
  answer char(1) not null check (answer in ('A', 'B', 'C', 'D')),
  is_correct boolean not null,
  primary key (attempt_id, question_id),
  foreign key (attempt_id, question_set_id)
    references attempts(id, question_set_id) on delete cascade,
  foreign key (question_set_id, question_id)
    references questions(question_set_id, id) on delete restrict
);

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  anonymous_session_id uuid not null,
  test_id uuid references tests(id) on delete set null,
  attempt_id uuid references attempts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table if not exists rate_limits (
  key_hash text not null,
  action text not null,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (key_hash, action)
);

alter table question_sets enable row level security;
alter table questions enable row level security;
alter table tests enable row level security;
alter table creator_answers enable row level security;
alter table attempts enable row level security;
alter table attempt_answers enable row level security;
alter table analytics_events enable row level security;
alter table rate_limits enable row level security;

create or replace function create_test(
  p_test_id uuid,
  p_question_set_id uuid,
  p_nickname text,
  p_share_code text,
  p_manage_token_hash text,
  p_answers jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'A complete 25-answer object is required';
  end if;
  if (select count(*) from jsonb_each(p_answers)) <> 25 then
    raise exception 'A complete 25-answer object is required';
  end if;
  if exists (select 1 from jsonb_each_text(p_answers) item where item.value not in ('A', 'B', 'C', 'D')) then
    raise exception 'Answer choices must be A, B, C, or D';
  end if;
  if (select count(*) from questions q where q.question_set_id = p_question_set_id) <> 25
    or (select count(*) from questions q join jsonb_each_text(p_answers) item on item.key = q.id
        where q.question_set_id = p_question_set_id) <> 25 then
    raise exception 'Answers do not match the selected question set';
  end if;

  insert into tests(id, question_set_id, nickname, share_code, manage_token_hash)
  values (p_test_id, p_question_set_id, p_nickname, p_share_code, p_manage_token_hash);

  insert into creator_answers(test_id, question_set_id, question_id, answer)
  select p_test_id, p_question_set_id, q.id, item.value::char(1)
  from questions q
  join jsonb_each_text(p_answers) item on item.key = q.id
  where q.question_set_id = p_question_set_id;

  return p_test_id;
end;
$$;

create or replace function create_attempt(
  p_attempt_id uuid,
  p_test_id uuid,
  p_nickname text,
  p_score smallint,
  p_idempotency_key uuid,
  p_answers jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt_id uuid;
  v_question_set_id uuid;
begin
  if jsonb_typeof(p_answers) <> 'object' then
    raise exception 'A complete 25-answer object is required';
  end if;
  if (select count(*) from jsonb_each(p_answers)) <> 25 then
    raise exception 'A complete 25-answer object is required';
  end if;
  if exists (
    select 1 from jsonb_each(p_answers) item
    where jsonb_typeof(item.value) <> 'object'
      or coalesce(item.value->>'answer', '') not in ('A', 'B', 'C', 'D')
      or coalesce(jsonb_typeof(item.value->'isCorrect'), '') <> 'boolean'
  ) then
    raise exception 'Attempt answers are invalid';
  end if;

  select question_set_id into v_question_set_id from tests where id = p_test_id;
  if v_question_set_id is null
    or (select count(*) from questions q join jsonb_each(p_answers) item on item.key = q.id
        where q.question_set_id = v_question_set_id) <> 25 then
    raise exception 'Answers do not match the test question set';
  end if;

  insert into attempts(id, test_id, question_set_id, nickname, score, idempotency_key)
  values (p_attempt_id, p_test_id, v_question_set_id, p_nickname, p_score, p_idempotency_key)
  on conflict (test_id, idempotency_key) do nothing
  returning id into v_attempt_id;

  if v_attempt_id is null then
    select id into v_attempt_id from attempts
    where test_id = p_test_id and idempotency_key = p_idempotency_key;
    return v_attempt_id;
  end if;

  insert into attempt_answers(attempt_id, question_set_id, question_id, answer, is_correct)
  select v_attempt_id, v_question_set_id, q.id, item.value->>'answer', (item.value->>'isCorrect')::boolean
  from questions q
  join jsonb_each(p_answers) item on item.key = q.id
  where q.question_set_id = v_question_set_id;

  return v_attempt_id;
end;
$$;

create or replace function check_rate_limit(
  p_key_hash text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Rate limit and window must be positive';
  end if;

  insert into rate_limits(key_hash, action, window_started_at, request_count)
  values (p_key_hash, p_action, now(), 1)
  on conflict (key_hash, action) do update
  set window_started_at = case
        when rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
        else rate_limits.window_started_at
      end,
      request_count = case
        when rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
        else rate_limits.request_count + 1
      end
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

create or replace function get_manage_stats(p_test_id uuid)
returns table(challenge_count bigint, average_score numeric)
language sql
security definer
set search_path = public, pg_temp
as $$
  select count(*)::bigint, coalesce(avg(score), 0)::numeric
  from attempts
  where test_id = p_test_id;
$$;

revoke execute on function create_test(uuid, uuid, text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function create_attempt(uuid, uuid, text, smallint, uuid, jsonb) from public, anon, authenticated;
revoke execute on function check_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke execute on function get_manage_stats(uuid) from public, anon, authenticated;
grant execute on function create_test(uuid, uuid, text, text, text, jsonb) to service_role;
grant execute on function create_attempt(uuid, uuid, text, smallint, uuid, jsonb) to service_role;
grant execute on function check_rate_limit(text, text, integer, integer) to service_role;
grant execute on function get_manage_stats(uuid) to service_role;
