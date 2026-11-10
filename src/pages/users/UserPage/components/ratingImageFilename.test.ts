import assert from 'node:assert/strict'
import test from 'node:test'
import { formatRatingImageFilename } from './ratingImageFilename.ts'

test('ユーザー名とローカル日時を含むレーティング画像ファイル名を生成すること', () => {
  // Given: ユーザー名とゼロ埋めが必要なローカル日時。
  const username = 'chuni_player'
  const date = new Date(2026, 7, 2, 3, 4, 5)

  // When: ダウンロードファイル名を生成する。
  const filename = formatRatingImageFilename(username, date)

  // Then: 指定された形式のJPGファイル名になる。
  assert.equal(filename, 'chunisupport-best-new-chuni_player-20260802030405.jpg')
})

test('Ver. 2 のレーティング画像ファイル名にバージョンを含めること', () => {
  // Given: ユーザー名と Ver. 2。
  const username = 'chuni_player'
  const date = new Date(2026, 7, 2, 3, 4, 5)

  // When: Ver. 2 のダウンロードファイル名を生成する。
  const filename = formatRatingImageFilename(username, date, 'v2')

  // Then: バージョン付きのJPGファイル名になる。
  assert.equal(filename, 'chunisupport-best-new-v2-chuni_player-20260802030405.jpg')
})
