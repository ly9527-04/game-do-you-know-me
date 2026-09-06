import type { Question } from '@/types/domain'

export const QUESTION_SET_VERSION = 1

const options = (a: string, b: string, c: string, d: string) => [
  { value: 'A' as const, text: a },
  { value: 'B' as const, text: b },
  { value: 'C' as const, text: c },
  { value: 'D' as const, text: d },
] as const

export const QUESTIONS = [
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
] as const satisfies readonly Question[]
