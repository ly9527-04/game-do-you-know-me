import { z } from 'zod'

import type { QuizAnswers } from '@/types/domain'

const answerChoiceSchema = z.enum(['A', 'B', 'C', 'D'])

const nicknameSchema = z.string()
  .transform((value) => value.trim())
  .refine((value) => Array.from(value).length >= 1 && Array.from(value).length <= 20, {
    message: 'Nickname must contain between 1 and 20 Unicode characters',
  })

const answersSchema = z.record(z.string().min(1), answerChoiceSchema)
  .refine((answers) => Object.keys(answers).length === 25, {
    message: 'Exactly 25 answers are required',
  })

const selectedQuestionIdsSchema = z.array(z.string().min(1))
  .length(25)
  .refine((questionIds) => new Set(questionIds).size === questionIds.length, {
    message: 'Selected question ids must be unique',
  })

export function validateSelectedAnswers(
  questionIds: readonly string[],
  answers: unknown,
): answers is QuizAnswers {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return false
  if (questionIds.length !== 25 || new Set(questionIds).size !== 25) return false
  const entries = Object.entries(answers)
  if (entries.length !== 25) return false
  const selectedIds = new Set(questionIds)
  return entries.every(([id, answer]) => selectedIds.has(id) && answerChoiceSchema.safeParse(answer).success)
}

export const createTestSchema = z.object({
  nickname: nicknameSchema,
  questionIds: selectedQuestionIdsSchema,
  answers: answersSchema,
  anonymousSessionId: z.uuid().optional(),
}).strict().superRefine((value, context) => {
  if (!validateSelectedAnswers(value.questionIds, value.answers)) {
    context.addIssue({ code: 'custom', message: 'Answers must exactly match selected questions', path: ['answers'] })
  }
})

export const createAttemptSchema = z.object({
  nickname: nicknameSchema,
  answers: answersSchema,
  idempotencyKey: z.uuid(),
  anonymousSessionId: z.uuid().optional(),
}).strict()

export const ANALYTICS_EVENT_NAMES = [
  'homepage_view',
  'create_test_click',
  'creator_quiz_start',
  'creator_quiz_complete',
  'share_link_copy',
  'friend_quiz_start',
  'friend_quiz_complete',
  'friend_create_own_test_click',
] as const

export type AnalyticsEventName = typeof ANALYTICS_EVENT_NAMES[number]

const allowedMetadataKeys = new Set(['source', 'surface', 'entrypoint'])
const forbiddenMetadataKeys = new Set(['answer', 'answers', 'managetoken', 'manage_token', 'ip', 'rawip'])

const metadataSchema = z.record(z.string(), z.unknown())
  .superRefine((metadata, context) => {
    for (const key of Object.keys(metadata)) {
      const normalizedKey = key.toLowerCase()
      if (forbiddenMetadataKeys.has(normalizedKey)) {
        context.addIssue({
          code: 'custom',
          message: `Sensitive analytics metadata key is not allowed: ${key}`,
          path: [key],
        })
      }
    }
  })
  .transform((metadata) => Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) =>
      allowedMetadataKeys.has(key) && typeof value === 'string' && value.length <= 64,
    ),
  ) as Record<string, string>)

export const eventSchema = z.object({
  eventName: z.enum(ANALYTICS_EVENT_NAMES),
  anonymousSessionId: z.uuid(),
  testId: z.uuid().optional(),
  attemptId: z.uuid().optional(),
  metadata: metadataSchema.optional().default({}),
}).strict()

export type AnalyticsEventInput = z.input<typeof eventSchema>
export type ValidatedAnalyticsEvent = z.output<typeof eventSchema>
