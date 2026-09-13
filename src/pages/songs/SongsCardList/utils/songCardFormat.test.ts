import assert from 'node:assert/strict'
import test from 'node:test'
import { formatSongCardReleaseDate, formatSongCardReleaseLine } from './songCardFormat'

test('追加日をYYYY/MM/DDへ整形すること', () => {
  // Given: YYYY-MM-DD の追加日。
  const release = '2024-03-07'

  // When: 表示用に整形する。
  const result = formatSongCardReleaseDate(release)

  // Then: 年4桁の日付になる。
  assert.equal(result, '2024/03/07')
})

test('追加日が未設定ならハイフンを返すこと', () => {
  // Given: 追加日なし。
  // When: 表示用に整形する。
  const result = formatSongCardReleaseDate(null)

  // Then: プレースホルダになる。
  assert.equal(result, '-')
})

test('追加日に短縮バージョン名を括弧書きすること', () => {
  // Given: 追加日とバージョン一覧。
  const release = '2024-03-07'
  const versions = [{ name: 'CHUNITHM LUMINOUS', released_at: '2024-03-07' }]

  // When: カード用の追加日行を作る。
  const result = formatSongCardReleaseLine(release, versions)

  // Then: 日付の後ろに短縮バージョン名が付く。
  assert.equal(result, '2024/03/07 (LUMINOUS)')
})
