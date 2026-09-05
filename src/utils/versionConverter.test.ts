import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterReleasedVersions,
  getTodayChunithmDate,
  resolveVersionNameByReleaseDate,
} from './versionConverter'

test('基準日以前に稼働開始したバージョンだけを返すこと', () => {
  // Given: 過去・当日・未来のバージョンがある。
  const versions = [
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
    { name: 'CHUNITHM XCROSS', released_at: '2026-09-03' },
    { name: 'CHUNITHM FUTURE', released_at: '2026-09-04' },
  ]

  // When: 基準日を指定して絞り込む。
  const result = filterReleasedVersions(versions, '2026-09-03')

  // Then: 当日を含めた過去分だけが返る。
  assert.deepEqual(
    result.map((version) => version.name),
    ['CHUNITHM VERSE', 'CHUNITHM XCROSS']
  )
})

test('絞り込みで元の順序を変えず、元配列を変更しないこと', () => {
  // Given: リリース日順ではない一覧がある。
  const versions = [
    { name: 'B', released_at: '2027-01-01' },
    { name: 'A', released_at: '2024-12-12' },
  ]

  // When: 絞り込む。
  const result = filterReleasedVersions(versions, '2026-09-03')

  // Then: 順序を保ったまま未来分だけ除かれ、元配列は変わらない。
  assert.deepEqual(
    result.map((version) => version.name),
    ['A']
  )
  assert.equal(versions.length, 2)
})

test('JST今日がYYYY-MM-DD形式で返ること', () => {
  // Given: なし。

  // When: JST今日を取得する。
  const result = getTodayChunithmDate()

  // Then: 日付形式である。
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/)
})

test('未来バージョンがあっても過去曲の解決結果は変わらないこと', () => {
  // Given: 未来バージョンを含む一覧がある。
  const versions = [
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
    { name: 'CHUNITHM FUTURE', released_at: '2027-01-01' },
  ]

  // When: 過去曲のリリース日から解決する。
  const result = resolveVersionNameByReleaseDate('2025-01-01', versions)

  // Then: 未来の影響を受けず過去バージョンになる。
  assert.equal(result, 'CHUNITHM VERSE')
})
