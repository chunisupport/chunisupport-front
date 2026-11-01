import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DIFFICULTY_BADGE_COMPACT_WIDTH_CLASS,
  DIFFICULTY_BADGE_FIXED_WIDTH_CLASS,
  getDifficultyBadgeWidthClass,
} from './difficultyBadgeLayout'

test('compact未指定（undefined）では通常表示用の固定幅クラスを返すこと', () => {
  // When
  const result = getDifficultyBadgeWidthClass(undefined)

  // Then
  assert.equal(result, DIFFICULTY_BADGE_FIXED_WIDTH_CLASS)
})

test('compactがfalseの場合は通常表示用の固定幅クラスを返すこと', () => {
  // When
  const result = getDifficultyBadgeWidthClass(false)

  // Then
  assert.equal(result, DIFFICULTY_BADGE_FIXED_WIDTH_CLASS)
})

test('compactがtrueの場合は省スペース表示用の内容幅クラスを返すこと', () => {
  // When
  const result = getDifficultyBadgeWidthClass(true)

  // Then
  assert.equal(result, DIFFICULTY_BADGE_COMPACT_WIDTH_CLASS)
})
