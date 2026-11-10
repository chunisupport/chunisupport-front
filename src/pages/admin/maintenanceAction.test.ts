import assert from 'node:assert/strict'
import test from 'node:test'
import { buildMaintenanceUpdateRequest, isMaintenanceCommentUnchanged } from './maintenanceAction'

test('開始時は正規化したコメントと有効状態を送ること', () => {
  // Given
  const comment = ' \r\nデータ更新中です\rしばらくお待ちください　'

  // When
  const result = buildMaintenanceUpdateRequest('start', comment)

  // Then
  assert.deepEqual(result, {
    enabled: true,
    comment: 'データ更新中です\nしばらくお待ちください',
  })
})

test('運用中のコメント更新は有効状態を維持すること', () => {
  // Given
  const comment = '終了予定を更新しました'

  // When
  const result = buildMaintenanceUpdateRequest('update', comment)

  // Then
  assert.deepEqual(result, {
    enabled: true,
    comment,
  })
})

test('終了時は入力値にかかわらず空コメントと無効状態を送ること', () => {
  // Given
  const comment = 'このコメントは送信しない'

  // When
  const result = buildMaintenanceUpdateRequest('end', comment)

  // Then
  assert.deepEqual(result, {
    enabled: false,
    comment: '',
  })
})

test('改行と前後空白の差だけなら公開中コメントから未変更と判定すること', () => {
  // Given
  const draftComment = ' \r\nデータ更新中です\r\n'
  const currentComment = 'データ更新中です'

  // When
  const result = isMaintenanceCommentUnchanged(draftComment, currentComment)

  // Then
  assert.equal(result, true)
})

test('正規化後の本文が異なる場合は変更ありと判定すること', () => {
  // Given
  const draftComment = '終了予定を更新しました'
  const currentComment = 'データ更新中です'

  // When
  const result = isMaintenanceCommentUnchanged(draftComment, currentComment)

  // Then
  assert.equal(result, false)
})
