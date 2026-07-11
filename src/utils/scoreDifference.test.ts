import assert from 'node:assert/strict'
import test from 'node:test'
import { formatScoreDifference, getScoreDifferenceClass } from './scoreDifference'

test('スコア差を桁区切りと符号付きで表示すること', () => {
  // Given / When / Then
  assert.equal(formatScoreDifference(1234), '+1,234')
  assert.equal(formatScoreDifference(-1234), '-1,234')
  assert.equal(formatScoreDifference(0), '+0')
})

test('スコア差に応じて難易度別統計と同じ文字色を返すこと', () => {
  // Given / When / Then
  assert.equal(getScoreDifferenceClass(1), 'text-success')
  assert.equal(getScoreDifferenceClass(-1), 'text-info')
  assert.equal(getScoreDifferenceClass(0), 'text-text-muted')
})
