import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSystemStatusDTO } from './systemStatus.ts'

const validStatus = {
  status: 'maintenance',
  comment: 'データ更新中',
  updated_at: '2026-07-26T12:30:00+09:00',
} as const

/** 形式不正時に公開される例外。偶発的な TypeError などと区別する。 */
const INVALID_RESPONSE_ERROR = {
  name: 'Error',
  message: 'システム状態のレスポンス形式が不正です',
}

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

  // When & Then: 形式エラーとして例外になる
  assert.throws(() => parseSystemStatusDTO(response), INVALID_RESPONSE_ERROR)
})

test('文字列ではないcommentを拒否すること', () => {
  // Given: 数値のcomment
  const response = { ...validStatus, comment: 123 }

  // When & Then: 形式エラーとして例外になる
  assert.throws(() => parseSystemStatusDTO(response), INVALID_RESPONSE_ERROR)
})

test('RFC3339ではないupdated_atを拒否すること', () => {
  // Given: 日時として解析できないupdated_at
  const response = { ...validStatus, updated_at: 'not-a-date' }

  // When & Then: 形式エラーとして例外になる
  assert.throws(() => parseSystemStatusDTO(response), INVALID_RESPONSE_ERROR)
})

test('日付のみで時刻を含まないupdated_atを拒否すること', () => {
  // Given: Dateとしては解析できるがRFC3339日時ではないupdated_at
  const response = { ...validStatus, updated_at: '2026-07-26' }

  // When & Then: 形式エラーとして例外になる
  assert.throws(() => parseSystemStatusDTO(response), INVALID_RESPONSE_ERROR)
})

for (const [label, response] of [
  ['null', null],
  ['文字列', 'maintenance'],
  ['statusが欠落したオブジェクト', { comment: 'データ更新中', updated_at: '2026-07-26T03:30:00Z' }],
] as const) {
  test(`構造が不正なレスポンス (${label}) を形式エラーとして拒否すること`, () => {
    // Given: オブジェクトではない、または必須項目が欠けたレスポンス
    // When & Then: プロパティ参照の偶発的な例外ではなく、形式エラーとして例外になる
    assert.throws(() => parseSystemStatusDTO(response), INVALID_RESPONSE_ERROR)
  })
}
