import { render, screen, fireEvent } from '@testing-library/react'
import { vi, beforeEach, it, expect } from 'vitest'
import { QUESTION_POOL } from '@/lib/questions'
import { questionGroup, QUESTION_GROUPS } from '@/lib/question-groups'
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }))
vi.mock('@/components/account/AccountQuiz', () => ({ AccountQuiz: ({ questions }: { questions: {id:string}[] }) => <div data-testid="selected-quiz">{questions.map(q => q.id).join(',')}</div> }))
import { TestBuilder } from '@/components/account/TestBuilder'
const props = { userId: 'user-a', nickname: '明', account: '00123456', previousTestId: null, questionSetId: 'set', questionSetVersion: 2, questions: [...QUESTION_POOL] }
beforeEach(() => localStorage.clear())
it('places every question in exactly one visible category', () => {
  expect(QUESTION_POOL).toHaveLength(120)
  for (const q of QUESTION_POOL) expect(QUESTION_GROUPS.filter(g => g.id === questionGroup(q))).toHaveLength(1)
})
it('shows eight category cards with exploratory descriptions', async () => {
  render(<TestBuilder {...props} />)
  expect(QUESTION_GROUPS).toHaveLength(8)
  expect(await screen.findByRole('button', { name: /价值观与边界/ })).toHaveTextContent(
    '有些答案，认识很久也未必知道',
  )
  expect(screen.getByRole('button', { name: /损友与社交/ })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /朋友互损/ })).not.toBeInTheDocument()
})
it('requires acknowledgement before replacing an existing test', async () => {
  render(<TestBuilder {...props} previousTestId="old" />)
  expect(screen.getByText('旧测试和排行榜将被清空')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /抽象与想象/ })).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '确认，继续创建' }))
  expect(await screen.findByRole('button', { name: /抽象与想象/ })).toBeInTheDocument()
})
it('allows any 25 distinct questions and passes exactly that selection to answering', async () => {
  render(<TestBuilder {...props} />)
  fireEvent.click(await screen.findByRole('button', { name: /抽象与想象/ }))
  for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
  expect(screen.getByRole('button', { name: '选好了，开始回答' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '返回分类' }))
  fireEvent.click(screen.getByRole('button', { name: /内心与关系/ }))
  for (const checkbox of screen.getAllByRole('checkbox')) fireEvent.click(checkbox)
  expect(screen.getByRole('status')).toHaveTextContent('已选 25 / 25 题')
  fireEvent.click(screen.getByRole('button', { name: '返回分类' }))
  fireEvent.click(screen.getByRole('button', { name: /日常生活/ }))
  for (const checkbox of screen.getAllByRole('checkbox')) expect(checkbox).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: '选好了，开始回答' }))
  const expectedSelection = ['abstract', 'inner']
    .flatMap(group => QUESTION_POOL.filter(q => questionGroup(q) === group))
    .slice(0, 25)
    .map(q => q.id)
  expect(screen.getByTestId('selected-quiz').textContent?.split(',')).toEqual(expectedSelection)
})
