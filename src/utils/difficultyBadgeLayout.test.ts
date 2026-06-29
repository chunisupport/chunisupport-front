import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DIFFICULTY_BADGE_COMPACT_WIDTH_CLASS,
  DIFFICULTY_BADGE_FIXED_WIDTH_CLASS,
  getDifficultyBadgeWidthClass,
} from './difficultyBadgeLayout'

test('通常表示の難易度バッジは文字数に左右されない固定幅クラスを返す', () => {
  // Given: 楽曲詳細画面で使う通常表示の難易度バッジ。
  const compact = undefined

  // When: 表示密度に応じた幅クラスを取得する。
  const result = getDifficultyBadgeWidthClass(compact)

  // Then: BASICやADVANCEDなど文字数が異なる難易度でも同じ幅になる。
  assert.equal(result, 'w-[5.75rem]')
  assert.equal(result, DIFFICULTY_BADGE_FIXED_WIDTH_CLASS)
})

test('省スペース表示の難易度バッジは分析表向けの内容幅クラスを返す', () => {
  // Given: 苦手譜面インスペクターなど表内で使う省スペース表示。
  const compact = true

  // When: 表示密度に応じた幅クラスを取得する。
  const result = getDifficultyBadgeWidthClass(compact)

  // Then: 表内では固定幅ではなく内容幅を維持する。
  assert.equal(result, DIFFICULTY_BADGE_COMPACT_WIDTH_CLASS)
})
