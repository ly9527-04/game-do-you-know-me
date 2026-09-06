import { z } from 'zod'

import { FIXED_QUESTION_IDS } from '@/types/domain'

const answerChoiceSchema = z.enum(['A', 'B', 'C', 'D'])
const questionAnswerShape = Object.fromEntries(
  FIXED_QUESTION_IDS.map((questionId) => [questionId, answerChoiceSchema]),
) as Record<(typeof FIXED_QUESTION_IDS)[number], typeof answerChoiceSchema>

const nicknameSchema = z.string()
  .transform((value) => value.trim())
  .refine((value) => Array.from(value).length >= 1 && Array.from(value).length <= 20, {
    message: 'Nickname must contain between 1 and 20 Unicode characters',
  })

const answersSchema = z.object(questionAnswerShape).strict()

export const createTestSchema = z.object({
  nickname: nicknameSchema,
  answers: answersSchema,
  anonymousSessionId: z.uuid().optional(),
}).strict()

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
