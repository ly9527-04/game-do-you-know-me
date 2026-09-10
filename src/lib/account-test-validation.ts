import { z } from 'zod'
import { validateSelectedAnswers } from '@/lib/validation'
const answers = z.record(z.string(), z.enum(['A','B','C','D']))
export const accountTestSchema = z.object({
  expectedUserId: z.uuid(),
  testId: z.uuid(),
  previousTestId: z.uuid().nullable(),
  questionSetId: z.uuid(),
  questionIds: z.array(z.string().min(1)).length(25),
  answers,
}).strict().refine((value) => validateSelectedAnswers(value.questionIds, value.answers), { message: '请选择并回答25道不同的题目' })
export const accountAttemptSchema = z.object({ expectedUserId: z.uuid(), testId: z.uuid(), answers }).strict()
