import assert from 'node:assert/strict'
import test from 'node:test'
import { formatPlayerLevelLabel, HIDDEN_PLAYER_LEVEL_LABEL } from './playerLevel'

test('プレイヤーレベルを通常表示すること', () => {
  // Given: 表示するプレイヤーレベル。
  const level = 15

  // When: 非表示にせず表示文字列を生成する。
  const result = formatPlayerLevelLabel(level)

  // Then: 実数値が付く。
  assert.equal(result, 'Lv. 15')
})

test('プレイヤーレベルを非表示にする場合はマスク表示すること', () => {
  // Given: 隠すプレイヤーレベル。
  const level = 25

  // When: 非表示にして表示文字列を生成する。
  const result = formatPlayerLevelLabel(level, true)

  // Then: 実数値の代わりにマスクになる。
  assert.equal(result, HIDDEN_PLAYER_LEVEL_LABEL)
  assert.equal(result, 'Lv. ＊＊＊')
})
