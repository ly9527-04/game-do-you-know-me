import { test as base, expect } from '@playwright/test'

export const test = base
export { expect }

export function databaseE2EReady(): boolean {
  return process.env.E2E_TEST_READY === '1'
}

export function skipWithoutDatabase() {
  test.skip(!databaseE2EReady(), '需要连接专用 E2E Supabase 项目（E2E_TEST_READY=1）')
}
