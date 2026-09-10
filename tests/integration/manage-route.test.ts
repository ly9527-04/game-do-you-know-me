import { GET } from '@/app/api/manage/tests/[testId]/route'
import { it, expect } from 'vitest'
it('retires anonymous entry without revealing answers or management credentials', async () => {
 const response=await GET(new Request('https://me.ly0688.online/legacy',{method:'GET'}))
 expect(response.status).toBe(410)
 expect(response.headers.get('cache-control')).toBe('no-store')
 const body=await response.json()
 expect(body.error.code).toBe('ENTRY_RETIRED')
 expect(body).not.toHaveProperty('answers')
 expect(body).not.toHaveProperty('manageUrl')
})
