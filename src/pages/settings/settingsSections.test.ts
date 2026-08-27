import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_SETTINGS_SECTION,
  normalizeSettingsSection,
  SETTINGS_SECTIONS,
} from './settingsSections'

test('既知の設定カテゴリはそのまま正規化されること', () => {
  // Given
  const section = 'api'

  // When
  const result = normalizeSettingsSection(section)

  // Then
  assert.equal(result, section)
})

test('未指定または未知の設定カテゴリは外観へ正規化されること', () => {
  // Given / When / Then
  assert.equal(normalizeSettingsSection(undefined), DEFAULT_SETTINGS_SECTION)
  assert.equal(normalizeSettingsSection('unknown'), DEFAULT_SETTINGS_SECTION)
})

test('旧セクションURLは対応する新カテゴリへ正規化されること', () => {
  // Given / When / Then
  assert.equal(normalizeSettingsSection('privacy'), 'profile')
  assert.equal(normalizeSettingsSection('api-token'), 'api')
  assert.equal(normalizeSettingsSection('data-transfer'), 'data')
  assert.equal(normalizeSettingsSection('player-data'), 'data')
  assert.equal(normalizeSettingsSection('account-delete'), 'account')
})

test('設定カテゴリが要求された情報設計の順序で定義されていること', () => {
  // Given / When
  const labels = SETTINGS_SECTIONS.map((section) => section.label)

  // Then
  assert.deepEqual(labels, ['外観', 'プロフィール', 'API・外部連携', 'データ管理', 'アカウント'])
})
