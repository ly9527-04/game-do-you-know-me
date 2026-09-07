import type { Question } from '@/types/domain'

export const QUESTION_SET_VERSION = 1

const options = (a: string, b: string, c: string, d: string) => [
  { value: 'A' as const, text: a },
  { value: 'B' as const, text: b },
  { value: 'C' as const, text: c },
  { value: 'D' as const, text: d },
] as const

const CLASSIC_QUESTIONS = [
  { id: 'q01', order: 1, prompt: '如果你是一间房，里面最可能有什么？', options: options('一张很大的床', '一堆没整理的小东西', '一扇一直开着的窗', '几乎什么都没有'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q02', order: 2, prompt: '如果你只能成为一种光，你会选？', options: options('路灯', '烛光', '舞台灯', '凌晨电脑屏幕的光'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q03', order: 3, prompt: '如果你的人生有一个存档点，你最想把它放在哪里？', options: options('某个夏天', '某段关系开始前', '某次重要决定之前', '就现在'), category: 'abstract', mismatchPriority: 2 },
  { id: 'q04', order: 4, prompt: '如果你的脑子里一直有一种背景音，它最像？', options: options('海浪', '很远的人群声', '风扇一直转的声音', '什么声音都没有'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q05', order: 5, prompt: '如果你是一栋建筑，你更像？', options: options('24 小时便利店', '图书馆', '废弃游乐园', '顶楼公寓'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q06', order: 6, prompt: '如果你是一把椅子，你最希望被放在哪里？', options: options('阳台', '餐桌旁', '没人的走廊', '路边'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q07', order: 7, prompt: '如果有人给你一把只能打开一次的钥匙，你希望门后是什么？', options: options('未来', '某个人心里', '另一种人生', '一个没人认识你的地方'), category: 'abstract', mismatchPriority: 2 },
  { id: 'q08', order: 8, prompt: '如果你的过去变成一个展览，你会怎么卖门票？', options: options('免费', '正常票价', '很贵', '不对外开放'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q09', order: 9, prompt: '如果你的情绪是一种交通工具，它更像？', options: options('高铁', '公交车', '过山车', '不知道去哪的出租车'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q10', order: 10, prompt: '如果你必须永远生活在一天中的一个时间段，你会选？', options: options('清晨', '午后', '黄昏', '深夜'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q11', order: 11, prompt: '如果你是一条没有终点的路，你希望两边是什么？', options: options('海', '城市', '森林', '什么都没有'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q12', order: 12, prompt: '如果你可以把一样东西永久锁进抽屉，你会放进去？', options: options('一段记忆', '一种情绪', '一个人', '自己的一部分'), category: 'abstract', mismatchPriority: 2 },
  { id: 'q13', order: 13, prompt: '如果某天醒来，所有人都不认识你了，你第一反应是？', options: options('害怕', '轻松', '有点兴奋', '想看看谁会重新认识我'), category: 'abstract', mismatchPriority: 2 },
  { id: 'q14', order: 14, prompt: '如果你的人生现在是一张地图，你觉得自己在哪？', options: options('起点', '岔路口', '半山腰', '地图上没标出来的地方'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q15', order: 15, prompt: '如果你在陌生城市里看到一个和你一模一样的人，你会？', options: options('跟上去', '和他打招呼', '假装没看到', '想知道他过得比我好不好'), category: 'abstract', mismatchPriority: 1 },
  { id: 'q16', order: 16, prompt: '如果有人真的把你看得很透，你更接近哪种感觉？', options: options('终于有人懂了', '有点不自在', '想躲开', '看是谁'), category: 'semi_abstract', mismatchPriority: 3 },
  { id: 'q17', order: 17, prompt: '如果你必须永久保留一种感觉，你会留下？', options: options('安全感', '新鲜感', '被需要', '自由'), category: 'semi_abstract', mismatchPriority: 2 },
  { id: 'q18', order: 18, prompt: '如果一段关系慢慢变淡，你更可能？', options: options('主动拉回来', '先观察', '顺其自然', '表面退出，但心里一直记着'), category: 'semi_abstract', mismatchPriority: 3 },
  { id: 'q19', order: 19, prompt: '如果你只能让别人记住你一个特点，你希望是？', options: options('有趣', '温柔', '厉害', '特别'), category: 'semi_abstract', mismatchPriority: 2 },
  { id: 'q20', order: 20, prompt: '如果你能知道未来的一件事，你最想知道？', options: options('自己以后会过什么生活', '会和谁一直在一起', '会不会赚到很多钱', '自己最终会变成什么样的人'), category: 'semi_abstract', mismatchPriority: 2 },
  { id: 'q21', order: 21, prompt: '你心情特别差的时候，最可能怎么处理？', options: options('找人聊', '自己待着', '睡觉', '假装没事继续干别的'), category: 'real_anchor', mismatchPriority: 3 },
  { id: 'q22', order: 22, prompt: '如果现在突然给你 10 万块，你第一反应更接近？', options: options('存起来', '买自己一直想买的东西', '投资或者赚钱', '拿去做一个一直想尝试的事情'), category: 'real_anchor', mismatchPriority: 2 },
  { id: 'q23', order: 23, prompt: '你喜欢上一个人以后，更可能变成？', options: options('明显主动', '偷偷暗示', '越喜欢越装', '等对方先来'), category: 'real_anchor', mismatchPriority: 3 },
  { id: 'q24', order: 24, prompt: '很熟的朋友临时放你鸽子，你真实反应是？', options: options('真无所谓', '嘴上无所谓，心里有点不爽', '直接说出来', '会默默重新判断这个人'), category: 'real_anchor', mismatchPriority: 3 },
  { id: 'q25', order: 25, prompt: '突然得到完整的一天空闲时间，你最可能？', options: options('马上找人出去玩', '躺一天', '自己出去乱逛', '做一直拖着没做的事'), category: 'real_anchor', mismatchPriority: 2 },
] as const satisfies readonly Omit<Question, 'poolGroup'>[]

export const QUESTIONS = CLASSIC_QUESTIONS.map((question) => ({
  ...question,
  poolGroup: 'classic' as const,
})) satisfies readonly Question[]

const NEW_QUESTIONS = [
  { id: 'q26', order: 26, prompt: '我起床后第一件事最可能是？', options: options('看手机', '洗漱', '继续赖床', '找东西吃'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q27', order: 27, prompt: '我洗澡一般属于哪种？', options: options('速战速决', '正常速度', '洗到忘记时间', '看心情'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q28', order: 28, prompt: '我出门一般属于？', options: options('提前到', '准时到', '极限踩点', '稳定迟到'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q29', order: 29, prompt: '我手机电量到多少会开始慌？', options: options('50%', '30%', '20%', '10%以下'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q30', order: 30, prompt: '我收到消息通常会？', options: options('基本秒回', '看到了就回', '想好再回', '看完忘了'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q31', order: 31, prompt: '我一个人在家的时候最常干嘛？', options: options('刷视频', '打游戏', '睡觉', '找人聊天'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q32', order: 32, prompt: '我最容易因为什么熬夜？', options: options('刷手机', '打游戏', '聊天', '单纯睡不着'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q33', order: 33, prompt: '我出门最容易忘记什么？', options: options('钥匙', '充电宝', '耳机', '什么都能忘'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q34', order: 34, prompt: '我拍照的时候最在意什么？', options: options('自己好不好看', '光线', '构图', '随便拍能看就行'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },
  { id: 'q35', order: 35, prompt: '我买东西的时候最纠结什么？', options: options('价格', '颜值', '实用性', '买完会不会后悔'), category: 'real_anchor', poolGroup: 'daily', mismatchPriority: 2 },

  { id: 'q36', order: 36, prompt: '我真的生气的时候一般会？', options: options('直接说出来', '突然变安静', '阴阳怪气', '表面没事'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 3 },
  { id: 'q37', order: 37, prompt: '遇到特别尴尬的事情，我会？', options: options('假装没发生', '自己先笑', '赶紧跑路', '反复回想一整天'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 2 },
  { id: 'q38', order: 38, prompt: '别人误会我的时候，我一般会？', options: options('马上解释', '看情况解释', '懒得解释', '嘴上不解释但很在意'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 3 },
  { id: 'q39', order: 39, prompt: '我做错事情被发现以后第一反应？', options: options('老实认错', '先找理由', '笑着糊弄过去', '试图转移话题'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 2 },
  { id: 'q40', order: 40, prompt: '我压力特别大的时候更可能？', options: options('找人聊天', '自己消化', '疯狂睡觉', '找别的事逃避'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 3 },
  { id: 'q41', order: 41, prompt: '我跟别人意见不一样的时候？', options: options('一定要辩明白', '会讨论但不较真', '懒得争', '看是谁再决定'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 2 },
  { id: 'q42', order: 42, prompt: '我被人夸以后最可能？', options: options('大方接受', '谦虚一下', '开玩笑带过去', '表面淡定心里爽'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 2 },
  { id: 'q43', order: 43, prompt: '我发现朋友干了件蠢事会？', options: options('先笑他', '先帮他', '先骂醒他', '一边笑一边帮'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 2 },
  { id: 'q44', order: 44, prompt: '我遇到麻烦第一反应更像？', options: options('自己想办法', '找朋友', '上网搜', '先摆一会儿'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 2 },
  { id: 'q45', order: 45, prompt: '我最受不了哪种人？', options: options('没有边界感', '爱装', '说话不算数', '情绪不稳定'), category: 'real_anchor', poolGroup: 'personality', mismatchPriority: 3 },

  { id: 'q46', order: 46, prompt: '我突然中了1万块，第一反应最可能是？', options: options('存起来', '买一直想买的东西', '请朋友吃饭', '先发消息炫耀'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q47', order: 47, prompt: '我一个人吃到超级好吃的东西，会？', options: options('默默吃完', '拍照发朋友圈', '发给某个人看', '立刻想下次带人来'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q48', order: 48, prompt: '我走在路上突然摔了一跤，会？', options: options('先看疼不疼', '先看有没有人看见', '自己笑出来', '立刻装作无事发生'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q49', order: 49, prompt: '我的外卖严重翻车，会？', options: options('将就吃', '找商家', '直接扔了重买', '拍照发给朋友吐槽'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q50', order: 50, prompt: '我在公共场合遇到熟人，但对方没看到我，会？', options: options('主动打招呼', '走过去拍他一下', '看关系决定', '假装自己也没看到'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q51', order: 51, prompt: '有人突然给我转500块不说原因，我会？', options: options('直接收', '先问干嘛', '收了再问', '不敢点'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q52', order: 52, prompt: '明天早八，但凌晨两点我还醒着，最可能是？', options: options('刷视频', '打游戏', '聊天', '后悔自己为什么还没睡'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q53', order: 53, prompt: '朋友突然说“出来玩吗”，我会？', options: options('立刻出门', '看跟谁', '看去哪', '大概率不想动'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q54', order: 54, prompt: '我坐车坐过站了，第一反应会？', options: options('骂自己', '无所谓下一站下', '发消息跟别人吐槽', '怀疑人生'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },
  { id: 'q55', order: 55, prompt: '一件东西我特别喜欢但明显有点贵，我会？', options: options('当场买', '忍住不买', '回去纠结好几天', '到处找平替'), category: 'real_anchor', poolGroup: 'scenario', mismatchPriority: 2 },

  { id: 'q56', order: 56, prompt: '我喜欢一个人的时候会？', options: options('明显主动', '疯狂分享日常', '表面没变化', '嘴上装得完全不在乎'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q57', order: 57, prompt: '我吃醋的时候最可能？', options: options('直接说', '阴阳两句', '自己憋着', '假装完全无所谓'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q58', order: 58, prompt: '喜欢的人很久不回消息，我会？', options: options('再发一条', '一直看手机', '也故意不回', '给自己找理由说他在忙'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q59', order: 59, prompt: '我更容易被什么吸引？', options: options('长相', '性格', '能力', '相处时的感觉'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q60', order: 60, prompt: '我更喜欢哪种聊天方式？', options: options('什么都分享', '深夜长聊', '天天互损', '有事说事但很舒服'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q61', order: 61, prompt: '我对一个人有好感，最明显的变化是？', options: options('主动找他', '回复明显变快', '记住很多小事', '以上都有可能'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q62', order: 62, prompt: '如果喜欢的人突然约我出去，我会？', options: options('秒答应', '装一下再答应', '先问去哪', '表面淡定其实已经开始准备'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q63', order: 63, prompt: '我跟喜欢的人吵架以后更可能？', options: options('主动找对方', '等对方找我', '发点暗示性的东西', '想找但忍住'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q64', order: 64, prompt: '什么最容易让我对一个人下头？', options: options('长得不好看', '聊天无聊', '人品有问题', '对我忽冷忽热'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },
  { id: 'q65', order: 65, prompt: '我最想要的恋爱状态更接近？', options: options('天天黏一起', '像最好的朋友', '各忙各的但很稳定', '又甜又有自己的空间'), category: 'real_anchor', poolGroup: 'relationship', mismatchPriority: 3 },

  { id: 'q66', order: 66, prompt: '如果我突然一天不回任何人消息，最可能是？', options: options('睡死了', '在忙', '心情不好', '单纯懒得回'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q67', order: 67, prompt: '我说“马上到”，实际意味着？', options: options('真的快到了', '刚出门', '正在穿鞋', '甚至还没起床'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q68', order: 68, prompt: '我说“我不生气”，真实情况是？', options: options('真没生气', '有一点', '已经生气了', '你最好别继续问'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 3 },
  { id: 'q69', order: 69, prompt: '我说“随便，你定”，意思最可能是？', options: options('真的随便', '有答案但不想说', '你先说我再否决', '我自己也不知道'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q70', order: 70, prompt: '我说“最后一把”，可信度？', options: options('100%', '70%', '30%', '什么最后一把？'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q71', order: 71, prompt: '我最容易在哪件事上嘴硬？', options: options('感情', '输赢', '自己犯错', '“我根本不在乎”'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 3 },
  { id: 'q72', order: 72, prompt: '如果我们一起出去旅游，我最可能负责？', options: options('做攻略', '找吃的', '拍照', '什么都不负责'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q73', order: 73, prompt: '我喝多以后最可能变成？', options: options('话痨', '安静', '疯狂找人聊天', '开始干抽象的事'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q74', order: 74, prompt: '如果我突然发财，我最可能膨胀在哪？', options: options('吃饭', '旅游', '买电子产品/衣服', '“我不会膨胀”然后全面膨胀'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
  { id: 'q75', order: 75, prompt: '我被朋友拍到丑照以后会？', options: options('无所谓', '让他删掉', '抢他手机', '先保存下来以后互相伤害'), category: 'real_anchor', poolGroup: 'roast', mismatchPriority: 2 },
] as const satisfies readonly Question[]

export const QUESTION_POOL = [...QUESTIONS, ...NEW_QUESTIONS] satisfies readonly Question[]
