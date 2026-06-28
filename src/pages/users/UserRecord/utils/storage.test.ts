import assert from 'node:assert/strict'
import test from 'node:test'

import type { RecordFilterDTO } from '../../../../types/api.ts'
import { getDefaultFilter } from './filtering.ts'

/**
 * API 設定に必要な環境変数を補って保存フィルターユーティリティを読み込む。
 *
 * @returns 保存フィルターユーティリティモジュール。
 */
const loadStorageModule = async () => {
  process.env.PUBLIC_BACKEND_URL = 'http://localhost:8787'
  process.env.PUBLIC_FRONTEND_URL = 'http://localhost:3000'
  process.env.PUBLIC_DOCUMENTATION_URL = 'https://docs.chunisupport.net'
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

test('buildSavedFilterRequest は通常レコード用の保存リクエストを生成する', async () => {
  // Given
  const { buildSavedFilterRequest } = await loadStorageModule()
  const filter = { ...getDefaultFilter(), title: '高難度' }

  // When
  const result = buildSavedFilterRequest('高難度FC狙い', filter)

  // Then
  assert.equal(result.name, '高難度FC狙い')
  assert.equal(result.filter_type, 'standard')
  assert.equal(result.schema_version, 3)
  assert.deepEqual(result.filter, filter)
})

test('toSavedFilter は現行スキーマのDTOを呼び出し可能な保存フィルターへ変換する', async () => {
  // Given
  const { toSavedFilter } = await loadStorageModule()
  const filter = { ...getDefaultFilter(), title: 'アルファ' }
  const dto: RecordFilterDTO = {
    id: '11111111-1111-1111-1111-111111111111',
    name: '高難度',
    filter_type: 'standard',
    schema_version: 3,
    filter,
    created_at: '2026-06-15T12:00:00Z',
    updated_at: '2026-06-15T12:00:00Z',
  }

  // When
  const result = toSavedFilter(dto)

  // Then
  assert.equal(result.id, dto.id)
  assert.equal(result.name, dto.name)
  assert.equal(result.schemaVersion, 3)
  assert.equal(result.isValid, true)
  assert.deepEqual(result.filter, filter)
})

test('toSavedFilter は旧スキーマのDTOを古くて無効な保存フィルターとして残す', async () => {
  // Given
  const { toSavedFilter } = await loadStorageModule()
  const dto: RecordFilterDTO = {
    id: '11111111-1111-1111-1111-111111111111',
    name: '旧形式',
    filter_type: 'standard',
    schema_version: 2,
    filter: { title: '旧条件' },
    created_at: '2026-06-15T12:00:00Z',
    updated_at: '2026-06-15T12:00:00Z',
  }

  // When
  const result = toSavedFilter(dto)

  // Then
  assert.equal(result.name, '旧形式')
  assert.equal(result.schemaVersion, 2)
  assert.equal(result.isValid, false)
  assert.equal(result.filter, null)
  assert.equal(result.invalidReason, '古い形式のため無効です。')
})
