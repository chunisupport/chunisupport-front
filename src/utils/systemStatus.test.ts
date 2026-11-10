import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSystemStatusDTO } from './systemStatus.ts'

const validStatus = {
  status: 'maintenance',
  comment: 'データ更新中',
  updated_at: '2026-07-26T12:30:00+09:00',
} as const

test('RFC3339Nanoの小数秒とタイムゾーンオフセットを受け入れること', () => {
  // Given: GoのRFC3339Nanoで生成されるマイクロ秒付き日時
  const response = {
    ...validStatus,
    updated_at: '2026-07-26T12:30:00.123456+09:00',
  }

  // When: 状態レスポンスを検証する
  const result = parseSystemStatusDTO(response)

  // Then: 値を維持したDTOとして返す
  assert.deepEqual(result, response)
})

test('UTCのRFC3339日時を受け入れること', () => {
  // Given: Z表記のRFC3339日時
  const response = {
    ...validStatus,
    updated_at: '2026-07-26T03:30:00Z',
  }

  // When & Then: 状態レスポンスを検証できる
  assert.deepEqual(parseSystemStatusDTO(response), response)
})

test('未定義のstatusを拒否すること', () => {
  // Given: API契約にないstatus
  const response = { ...validStatus, status: 'paused' }

  // When & Then: 不正レスポンスとして例外になる
  assert.throws(() => parseSystemStatusDTO(response))
})

test('文字列ではないcommentを拒否すること', () => {
  // Given: 数値のcomment
  const response = { ...validStatus, comment: 123 }

  // When & Then: 不正レスポンスとして例外になる
  assert.throws(() => parseSystemStatusDTO(response))
})

test('RFC3339ではないupdated_atを拒否すること', () => {
  // Given: 日時として解析できないupdated_at
  const response = { ...validStatus, updated_at: 'not-a-date' }

  // When & Then: 不正レスポンスとして例外になる
  assert.throws(() => parseSystemStatusDTO(response))
})
