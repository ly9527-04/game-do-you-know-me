import type { Question } from '@/types/domain'
export const QUESTION_GROUPS = [
  { id: 'abstract', label: '抽象与想象', description: '脑洞这东西，熟人也未必跟得上' },
  { id: 'inner', label: '内心与关系', description: '你不说出口的，TA真的知道吗' },
  { id: 'daily', label: '日常生活', description: '越不起眼的小习惯，越容易猜错' },
  { id: 'personality', label: '性格脾气', description: '好脾气还是硬脾气，看看TA懂几分' },
  { id: 'scenario', label: '情景选择', description: '事情真发生时，你会选哪条路' },
  { id: 'relationship', label: '情感与暧昧', description: '心动有迹可循，嘴硬可不一定' },
  { id: 'roast', label: '损友与社交', description: '敢来猜，说明你们确实挺熟' },
  { id: 'values', label: '价值观与边界', description: '有些答案，认识很久也未必知道' },
] as const
export function questionGroup(question: Question): string {
  if (question.poolGroup !== 'classic') return question.poolGroup
  return question.category === 'abstract' ? 'abstract' : 'inner'
}
