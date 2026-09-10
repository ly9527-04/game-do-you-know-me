import { z } from 'zod'
const password = z.string().refine(value => Array.from(value).length >= 8 && Array.from(value).length <= 128, '密码长度应为 8–128 个字符。')
export const loginSchema = z.object({
  account: z.string().regex(/^[0-9]{8}$/, '账号必须为 8 位数字。'),
  password,
})
export const registerSchema = loginSchema.extend({
  nickname: z.string().trim().refine(value => Array.from(value).length >= 1 && Array.from(value).length <= 20, '昵称长度应为 1–20 个字符。'),
  confirmPassword: password,
}).refine(value => value.password === value.confirmPassword, { message: '两次输入的密码不一致。', path: ['confirmPassword'] })
