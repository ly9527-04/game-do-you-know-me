import type { Question } from '@/types/domain'
export const QUESTION_GROUPS = [
  { id: 'abstract', label: '抽象与想象', description: '如果你是一束光、一间房…' },
  { id: 'inner', label: '内心与关系', description: '感受、选择与相处的方式' },
  { id: 'daily', label: '日常生活', description: '习惯、偏好和生活里的小事' },
  { id: 'personality', label: '性格脾气', description: '最像你的反应与态度' },
  { id: 'scenario', label: '情景选择', description: '遇到这些事情，你会怎么做' },
  { id: 'relationship', label: '情感与暧昧', description: '喜欢、心动与亲密关系' },
  { id: 'roast', label: '朋友互损', description: '嘴硬、搞怪和朋友才懂的你' },
] as const
export function questionGroup(question: Question): string {
  if (question.poolGroup !== 'classic') return question.poolGroup
  return question.category === 'abstract' ? 'abstract' : 'inner'
}
