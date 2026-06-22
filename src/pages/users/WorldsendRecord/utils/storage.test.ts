import assert from 'node:assert/strict'
import test from 'node:test'

import type { RecordFilterDTO } from '../../../../types/api'
import { DEFAULT_WORLDSEND_FILTER } from '../types/filterDefaults'

/**
 * API 設定に必要な環境変数を補って WORLD'S END 保存フィルターユーティリティを読み込む。
 *
 * @returns WORLD'S END 保存フィルターユーティリティモジュール。
 */
const loadStorageModule = async () => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:8787'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://help.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_URL = 'https://dist.chunisupport.net'
  process.env.PUBLIC_BOOKMARKLET_ENTRYPOINT = 'main.js'
  process.env.PUBLIC_CF_TURNSTILE_SITE_KEY = 'test-turnstile-site-key'
  process.env.PUBLIC_FB_API_KEY = 'test-api-key'
  process.env.PUBLIC_FB_AUTH_DOMAIN = 'test.firebaseapp.com'
  process.env.PUBLIC_FB_PROJECT_ID = 'test-project'
  process.env.PUBLIC_FB_STORAGE_BUCKET = 'test.appspot.com'
  process.env.PUBLIC_FB_MESSAGING_SENDER_ID = '123456789'
  process.env.PUBLIC_FB_APP_ID = 'test-app-id'
  return import('./storage.ts')
}

test("buildSavedWorldsendFilterRequest は WORLD'S END 用の保存リクエストを生成する", async () => {
  // Given
  const { buildSavedWorldsendFilterRequest } = await loadStorageModule()
  const filter = { ...DEFAULT_WORLDSEND_FILTER, title: 'WE' }

  // When
  const result = buildSavedWorldsendFilterRequest('WE高難度', filter)

  // Then
  assert.equal(result.name, 'WE高難度')
  assert.equal(result.filter_type, 'worldsend')
  assert.equal(result.schema_version, 2)
  assert.deepEqual(result.filter, filter)
})

test('toSavedWorldsendFilter は旧スキーマのDTOを古くて無効な保存フィルターとして残す', async () => {
  // Given
  const { toSavedWorldsendFilter } = await loadStorageModule()
  const dto: RecordFilterDTO = {
    id: '11111111-1111-1111-1111-111111111111',
    name: '旧WE',
    filter_type: 'worldsend',
    schema_version: 1,
    filter: { title: '旧条件' },
    created_at: '2026-06-15T12:00:00Z',
    updated_at: '2026-06-15T12:00:00Z',
  }

  // When
  const result = toSavedWorldsendFilter(dto)

  // Then
  assert.equal(result.name, '旧WE')
  assert.equal(result.schemaVersion, 1)
  assert.equal(result.isValid, false)
  assert.equal(result.filter, null)
  assert.equal(result.invalidReason, '古い形式のため無効です。')
})
