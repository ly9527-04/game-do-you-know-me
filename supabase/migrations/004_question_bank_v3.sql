begin;

alter table questions drop constraint if exists questions_pool_group_check;
alter table questions add constraint questions_pool_group_check
  check (pool_group in ('classic', 'abstract', 'inner', 'daily', 'personality', 'scenario', 'relationship', 'roast', 'values'));

alter table questions drop constraint if exists questions_sort_order_check;
alter table questions add constraint questions_sort_order_check
  check (sort_order between 1 and 120);

insert into question_sets(id, version, is_active)
values ('00000000-0000-4000-8000-000000000003', 3, false)
on conflict (version) do update set is_active = false;

insert into questions(id, question_set_id, sort_order, prompt, options, category, pool_group, mismatch_priority)
select id, '00000000-0000-4000-8000-000000000003', sort_order, prompt, options, category, pool_group, mismatch_priority
from questions
where question_set_id = '00000000-0000-4000-8000-000000000002'
on conflict (question_set_id, id) do update set
  sort_order = excluded.sort_order,
  prompt = excluded.prompt,
  options = excluded.options,
  category = excluded.category,
  pool_group = excluded.pool_group,
  mismatch_priority = excluded.mismatch_priority;

insert into questions(id, question_set_id, sort_order, prompt, options, category, pool_group, mismatch_priority) values
('q76','00000000-0000-4000-8000-000000000003',76,'如果一个很重要的人让我失望很多次，我更可能？','[{"value":"A","text":"直接说清楚"},{"value":"B","text":"慢慢疏远"},{"value":"C","text":"降低期待但继续相处"},{"value":"D","text":"再给一次机会"}]','real_anchor','values',3),
('q77','00000000-0000-4000-8000-000000000003',77,'对我来说，哪件事最难原谅？','[{"value":"A","text":"欺骗"},{"value":"B","text":"背叛"},{"value":"C","text":"不尊重"},{"value":"D","text":"在我需要时消失"}]','real_anchor','values',3),
('q78','00000000-0000-4000-8000-000000000003',78,'我最不喜欢别人碰我的哪条边界？','[{"value":"A","text":"隐私"},{"value":"B","text":"时间安排"},{"value":"C","text":"人际关系"},{"value":"D","text":"对我的决定指手画脚"}]','real_anchor','values',3),
('q79','00000000-0000-4000-8000-000000000003',79,'朋友做了一件我不认同、但和我无关的事，我会？','[{"value":"A","text":"直接劝他"},{"value":"B","text":"提醒一次"},{"value":"C","text":"尊重他的选择"},{"value":"D","text":"看严重程度再决定"}]','real_anchor','values',2),
('q80','00000000-0000-4000-8000-000000000003',80,'如果“喜欢”和“适合”只能选一个，我更倾向？','[{"value":"A","text":"喜欢"},{"value":"B","text":"适合"},{"value":"C","text":"看人生阶段"},{"value":"D","text":"宁愿都不要"}]','real_anchor','values',3),
('q81','00000000-0000-4000-8000-000000000003',81,'对我来说真正的朋友最重要的是？','[{"value":"A","text":"陪伴"},{"value":"B","text":"真诚"},{"value":"C","text":"可靠"},{"value":"D","text":"能理解彼此"}]','real_anchor','values',3),
('q82','00000000-0000-4000-8000-000000000003',82,'如果必须失去一种东西，我最不愿意失去？','[{"value":"A","text":"自由"},{"value":"B","text":"安全感"},{"value":"C","text":"被爱"},{"value":"D","text":"对生活的期待"}]','real_anchor','values',3),
('q83','00000000-0000-4000-8000-000000000003',83,'我更接受哪种人生？','[{"value":"A","text":"稳定普通"},{"value":"B","text":"冒险但精彩"},{"value":"C","text":"很成功但很忙"},{"value":"D","text":"自由但不确定"}]','real_anchor','values',3),
('q84','00000000-0000-4000-8000-000000000003',84,'我真正难过的时候，更希望别人怎么对我？','[{"value":"A","text":"陪我说话"},{"value":"B","text":"什么都不问，陪着就好"},{"value":"C","text":"给我一个人待着"},{"value":"D","text":"帮我想办法解决"}]','real_anchor','inner',3),
('q85','00000000-0000-4000-8000-000000000003',85,'我开始对一个人失望时，最明显的变化是？','[{"value":"A","text":"话变少"},{"value":"B","text":"不再主动"},{"value":"C","text":"表面正常但心里已经变了"},{"value":"D","text":"会直接说出来"}]','real_anchor','inner',3),
('q86','00000000-0000-4000-8000-000000000003',86,'我最怕别人误会我哪一点？','[{"value":"A","text":"我不在乎"},{"value":"B","text":"我很冷漠"},{"value":"C","text":"我没能力"},{"value":"D","text":"我不真诚"}]','real_anchor','inner',3),
('q87','00000000-0000-4000-8000-000000000003',87,'我最容易因为哪件事内耗？','[{"value":"A","text":"自己说错的话"},{"value":"B","text":"别人对我的态度"},{"value":"C","text":"做错的决定"},{"value":"D","text":"对未来的不确定"}]','real_anchor','inner',3),
('q88','00000000-0000-4000-8000-000000000003',88,'如果关系里出现矛盾，我最希望对方怎么做？','[{"value":"A","text":"当场说清楚"},{"value":"B","text":"等冷静后再谈"},{"value":"C","text":"主动来哄我"},{"value":"D","text":"给彼此一点空间"}]','real_anchor','inner',3),
('q89','00000000-0000-4000-8000-000000000003',89,'我更怕哪种孤独？','[{"value":"A","text":"没人陪"},{"value":"B","text":"没人理解"},{"value":"C","text":"有人在身边却很疏远"},{"value":"D","text":"自己不知道想要什么"}]','real_anchor','inner',3),
('q90','00000000-0000-4000-8000-000000000003',90,'如果我突然消失几天，我最可能是在？','[{"value":"A","text":"想清静"},{"value":"B","text":"情绪不好"},{"value":"C","text":"压力太大"},{"value":"D","text":"单纯不想和任何人说话"}]','real_anchor','inner',2),
('q91','00000000-0000-4000-8000-000000000003',91,'别人对我很好时，我更容易？','[{"value":"A","text":"很快接受"},{"value":"B","text":"慢慢建立信任"},{"value":"C","text":"怀疑为什么对我这么好"},{"value":"D","text":"表面接受但还是有防备"}]','real_anchor','inner',3),
('q92','00000000-0000-4000-8000-000000000003',92,'我看起来最不像、但其实最可能有的一面是？','[{"value":"A","text":"很敏感"},{"value":"B","text":"很好胜"},{"value":"C","text":"很没安全感"},{"value":"D","text":"特别容易心软"}]','real_anchor','personality',3),
('q93','00000000-0000-4000-8000-000000000003',93,'我做重大决定时，最容易受什么影响？','[{"value":"A","text":"理性分析"},{"value":"B","text":"第一感觉"},{"value":"C","text":"身边人的意见"},{"value":"D","text":"当时的情绪"}]','real_anchor','personality',3),
('q94','00000000-0000-4000-8000-000000000003',94,'我发现自己错了以后，最难的是？','[{"value":"A","text":"承认自己错了"},{"value":"B","text":"向别人道歉"},{"value":"C","text":"接受造成的后果"},{"value":"D","text":"不再反复想这件事"}]','real_anchor','personality',3),
('q95','00000000-0000-4000-8000-000000000003',95,'我遇到一个特别厉害的人，更可能？','[{"value":"A","text":"欣赏"},{"value":"B","text":"想向他学习"},{"value":"C","text":"被激起胜负欲"},{"value":"D","text":"有点压力"}]','real_anchor','personality',2),
('q96','00000000-0000-4000-8000-000000000003',96,'我被否定以后第一反应更接近？','[{"value":"A","text":"反思是不是自己有问题"},{"value":"B","text":"想证明对方错了"},{"value":"C","text":"表面没事但很在意"},{"value":"D","text":"很快就过去"}]','real_anchor','personality',3),
('q97','00000000-0000-4000-8000-000000000003',97,'我更接近哪一种“嘴硬”？','[{"value":"A","text":"明明难过说没事"},{"value":"B","text":"明明喜欢说一般"},{"value":"C","text":"明明在意说无所谓"},{"value":"D","text":"明明不会还要逞强"}]','real_anchor','personality',3),
('q98','00000000-0000-4000-8000-000000000003',98,'一个计划突然被打乱，我通常？','[{"value":"A","text":"很快适应"},{"value":"B","text":"有点烦但继续"},{"value":"C","text":"情绪明显受影响"},{"value":"D","text":"直接不想干了"}]','real_anchor','personality',2),
('q99','00000000-0000-4000-8000-000000000003',99,'我最容易在哪个瞬间对一个人产生好感？','[{"value":"A","text":"他对我很温柔"},{"value":"B","text":"发现我们特别聊得来"},{"value":"C","text":"看到他认真做事"},{"value":"D","text":"某个不起眼的小细节"}]','real_anchor','relationship',3),
('q100','00000000-0000-4000-8000-000000000003',100,'如果发现喜欢的人其实没那么喜欢我，我更可能？','[{"value":"A","text":"继续争取"},{"value":"B","text":"慢慢退出"},{"value":"C","text":"马上抽离"},{"value":"D","text":"嘴上退出但很久放不下"}]','real_anchor','relationship',3),
('q101','00000000-0000-4000-8000-000000000003',101,'哪种行为最容易让我感觉“被喜欢”？','[{"value":"A","text":"主动来找我"},{"value":"B","text":"记住我的小事"},{"value":"C","text":"愿意花时间陪我"},{"value":"D","text":"明确表达喜欢"}]','real_anchor','relationship',3),
('q102','00000000-0000-4000-8000-000000000003',102,'我更怕哪一种感情？','[{"value":"A","text":"很喜欢但没结果"},{"value":"B","text":"很稳定但没感觉"},{"value":"C","text":"对方忽冷忽热"},{"value":"D","text":"在一起后越来越陌生"}]','real_anchor','relationship',3),
('q103','00000000-0000-4000-8000-000000000003',103,'我真正喜欢上一个人以后，更想要的是？','[{"value":"A","text":"很多陪伴"},{"value":"B","text":"很深的交流"},{"value":"C","text":"明确的偏爱"},{"value":"D","text":"稳定的未来感"}]','real_anchor','relationship',3),
('q104','00000000-0000-4000-8000-000000000003',104,'如果两个人互相喜欢，但现实条件很难，我更可能？','[{"value":"A","text":"还是试试看"},{"value":"B","text":"先解决现实问题"},{"value":"C","text":"慢慢放弃"},{"value":"D","text":"看对方有多坚定"}]','real_anchor','relationship',3),
('q105','00000000-0000-4000-8000-000000000003',105,'在感情里，我最容易缺少的是？','[{"value":"A","text":"安全感"},{"value":"B","text":"新鲜感"},{"value":"C","text":"确定感"},{"value":"D","text":"个人空间"}]','real_anchor','relationship',3),
('q106','00000000-0000-4000-8000-000000000003',106,'如果人生是一款游戏，我最想把哪个属性点满？','[{"value":"A","text":"自由"},{"value":"B","text":"财富"},{"value":"C","text":"魅力"},{"value":"D","text":"好奇心"}]','real_anchor','abstract',2),
('q107','00000000-0000-4000-8000-000000000003',107,'如果能偷看自己十年后的一个画面，我最想看到？','[{"value":"A","text":"我住在哪里"},{"value":"B","text":"我身边是谁"},{"value":"C","text":"我在做什么"},{"value":"D","text":"我看起来开不开心"}]','real_anchor','abstract',3),
('q108','00000000-0000-4000-8000-000000000003',108,'如果人生必须删掉一种东西，我最舍得删？','[{"value":"A","text":"稳定"},{"value":"B","text":"刺激"},{"value":"C","text":"别人的认可"},{"value":"D","text":"对过去的执念"}]','real_anchor','abstract',3),
('q109','00000000-0000-4000-8000-000000000003',109,'如果可以获得一种能力，我最想要？','[{"value":"A","text":"回到过去"},{"value":"B","text":"看见未来"},{"value":"C","text":"知道别人真实想法"},{"value":"D","text":"随时去任何地方"}]','real_anchor','abstract',2),
('q110','00000000-0000-4000-8000-000000000003',110,'如果现在的自己能收到未来自己的四个字，我最希望是？','[{"value":"A","text":"“你做对了”"},{"value":"B","text":"“别怕，去吧”"},{"value":"C","text":"“一切值得”"},{"value":"D","text":"“换条路走”"}]','real_anchor','abstract',3),
('q111','00000000-0000-4000-8000-000000000003',111,'朋友被别人欺负了，但确实是他先犯贱，我会？','[{"value":"A","text":"先帮朋友再说"},{"value":"B","text":"先骂朋友"},{"value":"C","text":"谁有理帮谁"},{"value":"D","text":"一边帮一边骂"}]','real_anchor','roast',2),
('q112','00000000-0000-4000-8000-000000000003',112,'朋友半夜突然说“我心情不好”，我会？','[{"value":"A","text":"马上问怎么了"},{"value":"B","text":"直接打电话"},{"value":"C","text":"先逗他开心"},{"value":"D","text":"陪他说但不追问"}]','real_anchor','roast',3),
('q113','00000000-0000-4000-8000-000000000003',113,'一个很久没联系的朋友突然找我，我第一反应？','[{"value":"A","text":"挺开心"},{"value":"B","text":"好奇他找我干嘛"},{"value":"C","text":"有点尴尬"},{"value":"D","text":"完全能无缝接上"}]','real_anchor','roast',2),
('q114','00000000-0000-4000-8000-000000000003',114,'朋友和对象吵架来找我，我一般？','[{"value":"A","text":"无脑站朋友"},{"value":"B","text":"分析谁有问题"},{"value":"C","text":"先安慰再分析"},{"value":"D","text":"主要负责听他吐槽"}]','real_anchor','roast',2),
('q115','00000000-0000-4000-8000-000000000003',115,'朋友当众拿我的黑历史开玩笑，我更可能？','[{"value":"A","text":"一起笑"},{"value":"B","text":"当场反击"},{"value":"C","text":"表面笑但其实介意"},{"value":"D","text":"看他说到什么程度"}]','real_anchor','roast',3),
('q116','00000000-0000-4000-8000-000000000003',116,'我临时多出三天假期，最可能？','[{"value":"A","text":"马上出去玩"},{"value":"B","text":"在家躺三天"},{"value":"C","text":"找朋友一起安排"},{"value":"D","text":"临时起意去一个陌生地方"}]','real_anchor','daily',2),
('q117','00000000-0000-4000-8000-000000000003',117,'我点餐纠结很久，最后通常会？','[{"value":"A","text":"点最熟悉的"},{"value":"B","text":"点评价最高的"},{"value":"C","text":"点没吃过的"},{"value":"D","text":"让别人帮我选"}]','real_anchor','daily',2),
('q118','00000000-0000-4000-8000-000000000003',118,'突然下暴雨但我没带伞，我更可能？','[{"value":"A","text":"直接冲"},{"value":"B","text":"等雨小"},{"value":"C","text":"买把伞"},{"value":"D","text":"找人求救"}]','real_anchor','scenario',2),
('q119','00000000-0000-4000-8000-000000000003',119,'我无意中听到别人夸我，第一反应？','[{"value":"A","text":"偷偷开心"},{"value":"B","text":"想继续听"},{"value":"C","text":"假装没听见"},{"value":"D","text":"赶紧走，太尴尬了"}]','real_anchor','scenario',2),
('q120','00000000-0000-4000-8000-000000000003',120,'如果一天完全不用考虑钱，我最想拿来干嘛？','[{"value":"A","text":"吃顿特别好的"},{"value":"B","text":"买一直想买的东西"},{"value":"C","text":"去一个想去的地方"},{"value":"D","text":"和喜欢的人一起做点什么"}]','real_anchor','daily',3)
on conflict (question_set_id, id) do update set
  sort_order = excluded.sort_order,
  prompt = excluded.prompt,
  options = excluded.options,
  category = excluded.category,
  pool_group = excluded.pool_group,
  mismatch_priority = excluded.mismatch_priority;

do $$
declare
  v2_count integer;
  v3_count integer;
begin
  select count(*) into v2_count
  from questions where question_set_id = '00000000-0000-4000-8000-000000000002';
  select count(*) into v3_count
  from questions where question_set_id = '00000000-0000-4000-8000-000000000003';

  if v2_count not in (50, 75) or v3_count <> v2_count + 45 then
    raise exception 'QUESTION_BANK_V3_INCOMPLETE';
  end if;
  if v2_count = 75 and (select count(*) from questions where question_set_id = '00000000-0000-4000-8000-000000000003') <> 120 then
    raise exception 'QUESTION_BANK_V3_INCOMPLETE';
  end if;
end;
$$;

update question_sets set is_active = false;
update question_sets set is_active = true where version = 3;

commit;
