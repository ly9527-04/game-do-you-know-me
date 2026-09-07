begin;

alter table questions
  add column if not exists pool_group text not null default 'classic';

alter table questions drop constraint if exists questions_pool_group_check;
alter table questions add constraint questions_pool_group_check
  check (pool_group in ('classic', 'daily', 'personality', 'scenario', 'relationship', 'roast'));

alter table questions drop constraint if exists questions_sort_order_check;
alter table questions add constraint questions_sort_order_check
  check (sort_order between 1 and 75);

create table if not exists test_questions (
  test_id uuid not null,
  question_set_id uuid not null,
  question_id text not null,
  position smallint not null check (position between 1 and 25),
  primary key (test_id, question_id),
  unique (test_id, position),
  foreign key (test_id, question_set_id)
    references tests(id, question_set_id) on delete cascade,
  foreign key (question_set_id, question_id)
    references questions(question_set_id, id) on delete restrict
);

alter table test_questions enable row level security;

insert into test_questions(test_id, question_set_id, question_id, position)
select t.id, t.question_set_id, q.id, row_number() over (partition by t.id order by q.sort_order)::smallint
from tests t
join questions q on q.question_set_id = t.question_set_id
on conflict (test_id, question_id) do nothing;

insert into question_sets(id, version, is_active)
values ('00000000-0000-4000-8000-000000000002', 2, false)
on conflict (version) do update set is_active = false;

insert into questions(id, question_set_id, sort_order, prompt, options, category, pool_group, mismatch_priority)
select id, '00000000-0000-4000-8000-000000000002', sort_order, prompt, options, category, 'classic', mismatch_priority
from questions
where question_set_id = '00000000-0000-4000-8000-000000000001'
on conflict (question_set_id, id) do update set
  sort_order = excluded.sort_order,
  prompt = excluded.prompt,
  options = excluded.options,
  category = excluded.category,
  pool_group = excluded.pool_group,
  mismatch_priority = excluded.mismatch_priority;

insert into questions(id, question_set_id, sort_order, prompt, options, category, pool_group, mismatch_priority) values
('q26','00000000-0000-4000-8000-000000000002',26,'我起床后第一件事最可能是？','[{"value":"A","text":"看手机"},{"value":"B","text":"洗漱"},{"value":"C","text":"继续赖床"},{"value":"D","text":"找东西吃"}]','real_anchor','daily',2),
('q27','00000000-0000-4000-8000-000000000002',27,'我洗澡一般属于哪种？','[{"value":"A","text":"速战速决"},{"value":"B","text":"正常速度"},{"value":"C","text":"洗到忘记时间"},{"value":"D","text":"看心情"}]','real_anchor','daily',2),
('q28','00000000-0000-4000-8000-000000000002',28,'我出门一般属于？','[{"value":"A","text":"提前到"},{"value":"B","text":"准时到"},{"value":"C","text":"极限踩点"},{"value":"D","text":"稳定迟到"}]','real_anchor','daily',2),
('q29','00000000-0000-4000-8000-000000000002',29,'我手机电量到多少会开始慌？','[{"value":"A","text":"50%"},{"value":"B","text":"30%"},{"value":"C","text":"20%"},{"value":"D","text":"10%以下"}]','real_anchor','daily',2),
('q30','00000000-0000-4000-8000-000000000002',30,'我收到消息通常会？','[{"value":"A","text":"基本秒回"},{"value":"B","text":"看到了就回"},{"value":"C","text":"想好再回"},{"value":"D","text":"看完忘了"}]','real_anchor','daily',2),
('q31','00000000-0000-4000-8000-000000000002',31,'我一个人在家的时候最常干嘛？','[{"value":"A","text":"刷视频"},{"value":"B","text":"打游戏"},{"value":"C","text":"睡觉"},{"value":"D","text":"找人聊天"}]','real_anchor','daily',2),
('q32','00000000-0000-4000-8000-000000000002',32,'我最容易因为什么熬夜？','[{"value":"A","text":"刷手机"},{"value":"B","text":"打游戏"},{"value":"C","text":"聊天"},{"value":"D","text":"单纯睡不着"}]','real_anchor','daily',2),
('q33','00000000-0000-4000-8000-000000000002',33,'我出门最容易忘记什么？','[{"value":"A","text":"钥匙"},{"value":"B","text":"充电宝"},{"value":"C","text":"耳机"},{"value":"D","text":"什么都能忘"}]','real_anchor','daily',2),
('q34','00000000-0000-4000-8000-000000000002',34,'我拍照的时候最在意什么？','[{"value":"A","text":"自己好不好看"},{"value":"B","text":"光线"},{"value":"C","text":"构图"},{"value":"D","text":"随便拍能看就行"}]','real_anchor','daily',2),
('q35','00000000-0000-4000-8000-000000000002',35,'我买东西的时候最纠结什么？','[{"value":"A","text":"价格"},{"value":"B","text":"颜值"},{"value":"C","text":"实用性"},{"value":"D","text":"买完会不会后悔"}]','real_anchor','daily',2),
('q36','00000000-0000-4000-8000-000000000002',36,'我真的生气的时候一般会？','[{"value":"A","text":"直接说出来"},{"value":"B","text":"突然变安静"},{"value":"C","text":"阴阳怪气"},{"value":"D","text":"表面没事"}]','real_anchor','personality',3),
('q37','00000000-0000-4000-8000-000000000002',37,'遇到特别尴尬的事情，我会？','[{"value":"A","text":"假装没发生"},{"value":"B","text":"自己先笑"},{"value":"C","text":"赶紧跑路"},{"value":"D","text":"反复回想一整天"}]','real_anchor','personality',2),
('q38','00000000-0000-4000-8000-000000000002',38,'别人误会我的时候，我一般会？','[{"value":"A","text":"马上解释"},{"value":"B","text":"看情况解释"},{"value":"C","text":"懒得解释"},{"value":"D","text":"嘴上不解释但很在意"}]','real_anchor','personality',3),
('q39','00000000-0000-4000-8000-000000000002',39,'我做错事情被发现以后第一反应？','[{"value":"A","text":"老实认错"},{"value":"B","text":"先找理由"},{"value":"C","text":"笑着糊弄过去"},{"value":"D","text":"试图转移话题"}]','real_anchor','personality',2),
('q40','00000000-0000-4000-8000-000000000002',40,'我压力特别大的时候更可能？','[{"value":"A","text":"找人聊天"},{"value":"B","text":"自己消化"},{"value":"C","text":"疯狂睡觉"},{"value":"D","text":"找别的事逃避"}]','real_anchor','personality',3),
('q41','00000000-0000-4000-8000-000000000002',41,'我跟别人意见不一样的时候？','[{"value":"A","text":"一定要辩明白"},{"value":"B","text":"会讨论但不较真"},{"value":"C","text":"懒得争"},{"value":"D","text":"看是谁再决定"}]','real_anchor','personality',2),
('q42','00000000-0000-4000-8000-000000000002',42,'我被人夸以后最可能？','[{"value":"A","text":"大方接受"},{"value":"B","text":"谦虚一下"},{"value":"C","text":"开玩笑带过去"},{"value":"D","text":"表面淡定心里爽"}]','real_anchor','personality',2),
('q43','00000000-0000-4000-8000-000000000002',43,'我发现朋友干了件蠢事会？','[{"value":"A","text":"先笑他"},{"value":"B","text":"先帮他"},{"value":"C","text":"先骂醒他"},{"value":"D","text":"一边笑一边帮"}]','real_anchor','personality',2),
('q44','00000000-0000-4000-8000-000000000002',44,'我遇到麻烦第一反应更像？','[{"value":"A","text":"自己想办法"},{"value":"B","text":"找朋友"},{"value":"C","text":"上网搜"},{"value":"D","text":"先摆一会儿"}]','real_anchor','personality',2),
('q45','00000000-0000-4000-8000-000000000002',45,'我最受不了哪种人？','[{"value":"A","text":"没有边界感"},{"value":"B","text":"爱装"},{"value":"C","text":"说话不算数"},{"value":"D","text":"情绪不稳定"}]','real_anchor','personality',3),
('q46','00000000-0000-4000-8000-000000000002',46,'我突然中了1万块，第一反应最可能是？','[{"value":"A","text":"存起来"},{"value":"B","text":"买一直想买的东西"},{"value":"C","text":"请朋友吃饭"},{"value":"D","text":"先发消息炫耀"}]','real_anchor','scenario',2),
('q47','00000000-0000-4000-8000-000000000002',47,'我一个人吃到超级好吃的东西，会？','[{"value":"A","text":"默默吃完"},{"value":"B","text":"拍照发朋友圈"},{"value":"C","text":"发给某个人看"},{"value":"D","text":"立刻想下次带人来"}]','real_anchor','scenario',2),
('q48','00000000-0000-4000-8000-000000000002',48,'我走在路上突然摔了一跤，会？','[{"value":"A","text":"先看疼不疼"},{"value":"B","text":"先看有没有人看见"},{"value":"C","text":"自己笑出来"},{"value":"D","text":"立刻装作无事发生"}]','real_anchor','scenario',2),
('q49','00000000-0000-4000-8000-000000000002',49,'我的外卖严重翻车，会？','[{"value":"A","text":"将就吃"},{"value":"B","text":"找商家"},{"value":"C","text":"直接扔了重买"},{"value":"D","text":"拍照发给朋友吐槽"}]','real_anchor','scenario',2),
('q50','00000000-0000-4000-8000-000000000002',50,'我在公共场合遇到熟人，但对方没看到我，会？','[{"value":"A","text":"主动打招呼"},{"value":"B","text":"走过去拍他一下"},{"value":"C","text":"看关系决定"},{"value":"D","text":"假装自己也没看到"}]','real_anchor','scenario',2),
('q51','00000000-0000-4000-8000-000000000002',51,'有人突然给我转500块不说原因，我会？','[{"value":"A","text":"直接收"},{"value":"B","text":"先问干嘛"},{"value":"C","text":"收了再问"},{"value":"D","text":"不敢点"}]','real_anchor','scenario',2),
('q52','00000000-0000-4000-8000-000000000002',52,'明天早八，但凌晨两点我还醒着，最可能是？','[{"value":"A","text":"刷视频"},{"value":"B","text":"打游戏"},{"value":"C","text":"聊天"},{"value":"D","text":"后悔自己为什么还没睡"}]','real_anchor','scenario',2),
('q53','00000000-0000-4000-8000-000000000002',53,'朋友突然说“出来玩吗”，我会？','[{"value":"A","text":"立刻出门"},{"value":"B","text":"看跟谁"},{"value":"C","text":"看去哪"},{"value":"D","text":"大概率不想动"}]','real_anchor','scenario',2),
('q54','00000000-0000-4000-8000-000000000002',54,'我坐车坐过站了，第一反应会？','[{"value":"A","text":"骂自己"},{"value":"B","text":"无所谓下一站下"},{"value":"C","text":"发消息跟别人吐槽"},{"value":"D","text":"怀疑人生"}]','real_anchor','scenario',2),
('q55','00000000-0000-4000-8000-000000000002',55,'一件东西我特别喜欢但明显有点贵，我会？','[{"value":"A","text":"当场买"},{"value":"B","text":"忍住不买"},{"value":"C","text":"回去纠结好几天"},{"value":"D","text":"到处找平替"}]','real_anchor','scenario',2),
('q56','00000000-0000-4000-8000-000000000002',56,'我喜欢一个人的时候会？','[{"value":"A","text":"明显主动"},{"value":"B","text":"疯狂分享日常"},{"value":"C","text":"表面没变化"},{"value":"D","text":"嘴上装得完全不在乎"}]','real_anchor','relationship',3),
('q57','00000000-0000-4000-8000-000000000002',57,'我吃醋的时候最可能？','[{"value":"A","text":"直接说"},{"value":"B","text":"阴阳两句"},{"value":"C","text":"自己憋着"},{"value":"D","text":"假装完全无所谓"}]','real_anchor','relationship',3),
('q58','00000000-0000-4000-8000-000000000002',58,'喜欢的人很久不回消息，我会？','[{"value":"A","text":"再发一条"},{"value":"B","text":"一直看手机"},{"value":"C","text":"也故意不回"},{"value":"D","text":"给自己找理由说他在忙"}]','real_anchor','relationship',3),
('q59','00000000-0000-4000-8000-000000000002',59,'我更容易被什么吸引？','[{"value":"A","text":"长相"},{"value":"B","text":"性格"},{"value":"C","text":"能力"},{"value":"D","text":"相处时的感觉"}]','real_anchor','relationship',3),
('q60','00000000-0000-4000-8000-000000000002',60,'我更喜欢哪种聊天方式？','[{"value":"A","text":"什么都分享"},{"value":"B","text":"深夜长聊"},{"value":"C","text":"天天互损"},{"value":"D","text":"有事说事但很舒服"}]','real_anchor','relationship',3),
('q61','00000000-0000-4000-8000-000000000002',61,'我对一个人有好感，最明显的变化是？','[{"value":"A","text":"主动找他"},{"value":"B","text":"回复明显变快"},{"value":"C","text":"记住很多小事"},{"value":"D","text":"以上都有可能"}]','real_anchor','relationship',3),
('q62','00000000-0000-4000-8000-000000000002',62,'如果喜欢的人突然约我出去，我会？','[{"value":"A","text":"秒答应"},{"value":"B","text":"装一下再答应"},{"value":"C","text":"先问去哪"},{"value":"D","text":"表面淡定其实已经开始准备"}]','real_anchor','relationship',3),
('q63','00000000-0000-4000-8000-000000000002',63,'我跟喜欢的人吵架以后更可能？','[{"value":"A","text":"主动找对方"},{"value":"B","text":"等对方找我"},{"value":"C","text":"发点暗示性的东西"},{"value":"D","text":"想找但忍住"}]','real_anchor','relationship',3),
('q64','00000000-0000-4000-8000-000000000002',64,'什么最容易让我对一个人下头？','[{"value":"A","text":"长得不好看"},{"value":"B","text":"聊天无聊"},{"value":"C","text":"人品有问题"},{"value":"D","text":"对我忽冷忽热"}]','real_anchor','relationship',3),
('q65','00000000-0000-4000-8000-000000000002',65,'我最想要的恋爱状态更接近？','[{"value":"A","text":"天天黏一起"},{"value":"B","text":"像最好的朋友"},{"value":"C","text":"各忙各的但很稳定"},{"value":"D","text":"又甜又有自己的空间"}]','real_anchor','relationship',3),
('q66','00000000-0000-4000-8000-000000000002',66,'如果我突然一天不回任何人消息，最可能是？','[{"value":"A","text":"睡死了"},{"value":"B","text":"在忙"},{"value":"C","text":"心情不好"},{"value":"D","text":"单纯懒得回"}]','real_anchor','roast',2),
('q67','00000000-0000-4000-8000-000000000002',67,'我说“马上到”，实际意味着？','[{"value":"A","text":"真的快到了"},{"value":"B","text":"刚出门"},{"value":"C","text":"正在穿鞋"},{"value":"D","text":"甚至还没起床"}]','real_anchor','roast',2),
('q68','00000000-0000-4000-8000-000000000002',68,'我说“我不生气”，真实情况是？','[{"value":"A","text":"真没生气"},{"value":"B","text":"有一点"},{"value":"C","text":"已经生气了"},{"value":"D","text":"你最好别继续问"}]','real_anchor','roast',3),
('q69','00000000-0000-4000-8000-000000000002',69,'我说“随便，你定”，意思最可能是？','[{"value":"A","text":"真的随便"},{"value":"B","text":"有答案但不想说"},{"value":"C","text":"你先说我再否决"},{"value":"D","text":"我自己也不知道"}]','real_anchor','roast',2),
('q70','00000000-0000-4000-8000-000000000002',70,'我说“最后一把”，可信度？','[{"value":"A","text":"100%"},{"value":"B","text":"70%"},{"value":"C","text":"30%"},{"value":"D","text":"什么最后一把？"}]','real_anchor','roast',2),
('q71','00000000-0000-4000-8000-000000000002',71,'我最容易在哪件事上嘴硬？','[{"value":"A","text":"感情"},{"value":"B","text":"输赢"},{"value":"C","text":"自己犯错"},{"value":"D","text":"“我根本不在乎”"}]','real_anchor','roast',3),
('q72','00000000-0000-4000-8000-000000000002',72,'如果我们一起出去旅游，我最可能负责？','[{"value":"A","text":"做攻略"},{"value":"B","text":"找吃的"},{"value":"C","text":"拍照"},{"value":"D","text":"什么都不负责"}]','real_anchor','roast',2),
('q73','00000000-0000-4000-8000-000000000002',73,'我喝多以后最可能变成？','[{"value":"A","text":"话痨"},{"value":"B","text":"安静"},{"value":"C","text":"疯狂找人聊天"},{"value":"D","text":"开始干抽象的事"}]','real_anchor','roast',2),
('q74','00000000-0000-4000-8000-000000000002',74,'如果我突然发财，我最可能膨胀在哪？','[{"value":"A","text":"吃饭"},{"value":"B","text":"旅游"},{"value":"C","text":"买电子产品/衣服"},{"value":"D","text":"“我不会膨胀”然后全面膨胀"}]','real_anchor','roast',2),
('q75','00000000-0000-4000-8000-000000000002',75,'我被朋友拍到丑照以后会？','[{"value":"A","text":"无所谓"},{"value":"B","text":"让他删掉"},{"value":"C","text":"抢他手机"},{"value":"D","text":"先保存下来以后互相伤害"}]','real_anchor','roast',2)
on conflict (question_set_id, id) do update set
  sort_order = excluded.sort_order,
  prompt = excluded.prompt,
  options = excluded.options,
  category = excluded.category,
  pool_group = excluded.pool_group,
  mismatch_priority = excluded.mismatch_priority;

drop function if exists create_test(uuid, uuid, text, text, text, jsonb);

create or replace function create_test(
  p_test_id uuid,
  p_question_set_id uuid,
  p_nickname text,
  p_share_code text,
  p_manage_token_hash text,
  p_question_ids text[],
  p_answers jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(p_answers) <> 'object'
    or (select count(*) from jsonb_each(p_answers)) <> 25 then
    raise exception 'A complete 25-answer object is required';
  end if;
  if cardinality(p_question_ids) <> 25
    or (select count(distinct id) from unnest(p_question_ids) selected(id)) <> 25 then
    raise exception 'Invalid question selection';
  end if;
  if exists (select 1 from jsonb_each_text(p_answers) item where item.value not in ('A', 'B', 'C', 'D')) then
    raise exception 'Answer choices must be A, B, C, or D';
  end if;
  if (select count(*) from questions q join unnest(p_question_ids) selected(id) on selected.id = q.id
      where q.question_set_id = p_question_set_id) <> 25
    or (select count(*) from jsonb_each_text(p_answers) answer join unnest(p_question_ids) selected(id) on selected.id = answer.key) <> 25 then
    raise exception 'Answers do not match the selected questions';
  end if;
  if (select count(distinct counts.pool_group) from (
        select q.pool_group, count(*) as selected_count
        from questions q
        join unnest(p_question_ids) selected(id) on selected.id = q.id
        where q.question_set_id = p_question_set_id
        group by q.pool_group
      ) counts
      where counts.selected_count = case counts.pool_group
        when 'classic' then 5
        when 'daily' then 4
        when 'personality' then 4
        when 'scenario' then 4
        when 'relationship' then 4
        when 'roast' then 4
        else 0 end) <> 6 then
    raise exception 'Invalid balanced question selection';
  end if;

  insert into tests(id, question_set_id, nickname, share_code, manage_token_hash)
  values (p_test_id, p_question_set_id, p_nickname, p_share_code, p_manage_token_hash);

  insert into test_questions(test_id, question_set_id, question_id, position)
  select p_test_id, p_question_set_id, selected.id, selected.position::smallint
  from unnest(p_question_ids) with ordinality as selected(id, position);

  insert into creator_answers(test_id, question_set_id, question_id, answer)
  select p_test_id, p_question_set_id, selected.id, answer.value::char(1)
  from unnest(p_question_ids) selected(id)
  join jsonb_each_text(p_answers) answer on answer.key = selected.id;

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
  if jsonb_typeof(p_answers) <> 'object'
    or (select count(*) from jsonb_each(p_answers)) <> 25 then
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
    or (select count(*) from test_questions tq join jsonb_each(p_answers) item on item.key = tq.question_id
        where tq.test_id = p_test_id and tq.question_set_id = v_question_set_id) <> 25 then
    raise exception 'Answers do not match the test questions';
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
  select v_attempt_id, v_question_set_id, tq.question_id, item.value->>'answer', (item.value->>'isCorrect')::boolean
  from test_questions tq
  join jsonb_each(p_answers) item on item.key = tq.question_id
  where tq.test_id = p_test_id;

  return v_attempt_id;
end;
$$;

revoke execute on function create_test(uuid, uuid, text, text, text, text[], jsonb) from public, anon, authenticated;
revoke execute on function create_attempt(uuid, uuid, text, smallint, uuid, jsonb) from public, anon, authenticated;
grant execute on function create_test(uuid, uuid, text, text, text, text[], jsonb) to service_role;
grant execute on function create_attempt(uuid, uuid, text, smallint, uuid, jsonb) to service_role;

update question_sets set is_active = false;
update question_sets set is_active = true where version = 2;

commit;
