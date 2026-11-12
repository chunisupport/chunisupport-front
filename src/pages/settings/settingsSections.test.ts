import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSettingsSection } from './settingsSections'

test('既知の設定カテゴリはそのまま正規化されること', () => {
  // Given
  const section = 'api'

  // When
  const result = normalizeSettingsSection(section)

  // Then
  assert.equal(result, section)
})

for (const { name, section } of [
  { name: '未指定', section: undefined },
  { name: '未知', section: 'unknown' },
]) {
  test(`${name}の設定カテゴリは外観へ正規化されること`, () => {
    // Given: 未指定または未知のカテゴリ。
    // When
    const result = normalizeSettingsSection(section)

    // Then
    assert.equal(result, 'appearance')
  })
}

test('旧セクションURLは対応する新カテゴリへ正規化されること', () => {
  // Given / When / Then
  assert.equal(normalizeSettingsSection('privacy'), 'profile')
  assert.equal(normalizeSettingsSection('api-token'), 'api')
  assert.equal(normalizeSettingsSection('data-transfer'), 'data')
  assert.equal(normalizeSettingsSection('player-data'), 'data')
  assert.equal(normalizeSettingsSection('account-delete'), 'account')
})
