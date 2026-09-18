import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatSongCardReleaseDate,
  formatSongCardReleaseLine,
  formatSongCardReleaseVersion,
} from './songCardFormat'

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

test('追加日があるときフルバージョン名を返すこと', () => {
  // Given: 追加日とバージョン一覧。
  const release = '2024-03-07'
  const versions = [{ name: 'CHUNITHM LUMINOUS', released_at: '2024-03-07' }]

  // When: カード用のバージョン名を作る。
  const result = formatSongCardReleaseVersion(release, versions)

  // Then: CHUNITHM を含むフル名になる。
  assert.equal(result, 'CHUNITHM LUMINOUS')
})

test('追加日が未設定ならバージョン名はnullであること', () => {
  // Given: 追加日なし。
  // When: カード用のバージョン名を作る。
  const result = formatSongCardReleaseVersion(null, [])

  // Then: 日付が無いのでバージョンも出さない。
  assert.equal(result, null)
})

test('追加日の後ろにフルバージョン名を空白区切りで付けること', () => {
  // Given: 追加日とバージョン一覧。
  const release = '2024-03-07'
  const versions = [{ name: 'CHUNITHM LUMINOUS', released_at: '2024-03-07' }]

  // When: カード用の追加日行を作る。
  const result = formatSongCardReleaseLine(release, versions)

  // Then: 括弧なしのフルバージョン名が付く。
  assert.equal(result, '2024/03/07 CHUNITHM LUMINOUS')
})
