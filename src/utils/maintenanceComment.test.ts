import assert from 'node:assert/strict'
import test from 'node:test'
import { MAINTENANCE_COMMENT_MAX_CODE_POINTS } from '../constants/maintenance'
import {
  countMaintenanceCommentCodePoints,
  normalizeMaintenanceComment,
  validateMaintenanceComment,
} from './maintenanceComment'

test('CRLFとCRをLFへ統一し、前後のUnicode空白を除去すること', () => {
  // Given
  const value = ' \r\nデータ更新中です\rしばらくお待ちください\r\n　'

  // When
  const result = normalizeMaintenanceComment(value)

  // Then
  assert.equal(result, 'データ更新中です\nしばらくお待ちください')
})

test('サロゲートペアを1コードポイントとして数えること', () => {
  // Given
  const value = '更新中😀'

  // When
  const result = countMaintenanceCommentCodePoints(value)

  // Then
  assert.equal(result, 4)
})

test('1000コードポイントのコメントを許可すること', () => {
  // Given
  const value = '😀'.repeat(MAINTENANCE_COMMENT_MAX_CODE_POINTS)

  // When
  const result = validateMaintenanceComment(value, { required: true })

  // Then
  assert.deepEqual(result, { value, error: null })
})

test('1001コードポイントのコメントを拒否すること', () => {
  // Given
  const value = '保'.repeat(MAINTENANCE_COMMENT_MAX_CODE_POINTS + 1)

  // When
  const result = validateMaintenanceComment(value, { required: true })

  // Then
  assert.equal(result.error, 'too_long')
})

test('開始時は空白と改行だけのコメントを拒否すること', () => {
  // Given
  const value = ' \r\n　 '

  // When
  const result = validateMaintenanceComment(value, { required: true })

  // Then
  assert.deepEqual(result, { value: '', error: 'required' })
})

test('終了時は空コメントを許可すること', () => {
  // Given
  const value = ''

  // When
  const result = validateMaintenanceComment(value)

  // Then
  assert.deepEqual(result, { value: '', error: null })
})

test('LF以外のCc制御文字を前後にあっても拒否すること', () => {
  // Given
  const values = ['更新\t中', '\t更新中\t', '更新\u0000中', '更新\u0085中']

  // When
  const results = values.map((value) => validateMaintenanceComment(value))

  // Then
  assert.ok(results.every((result) => result.error === 'control_character'))
})

test('LFの改行を含むコメントを許可すること', () => {
  // Given
  const value = 'データ更新中です\nしばらくお待ちください'

  // When
  const result = validateMaintenanceComment(value, { required: true })

  // Then
  assert.deepEqual(result, { value, error: null })
})
