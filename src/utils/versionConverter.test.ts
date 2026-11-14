import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterReleasedVersions,
  getReleasedVersionShortNames,
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

test('絞り込み結果が1件でも元配列を変更しないこと', () => {
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
  assert.deepEqual(versions, [
    { name: 'B', released_at: '2027-01-01' },
    { name: 'A', released_at: '2024-12-12' },
  ])
})

test('公開済みバージョンが複数あっても元の順序と元配列全体を維持すること', () => {
  // Given: 公開済みの2件は日付降順で、間に未来のバージョンがある。
  const versions = [
    { name: 'B', released_at: '2025-12-11' },
    { name: 'FUTURE', released_at: '2027-01-01' },
    { name: 'A', released_at: '2024-12-12' },
  ]

  // When
  const result = filterReleasedVersions(versions, '2026-09-03')

  // Then: 日付で並べ替えず、入力の値も順序も変更しない。
  assert.deepEqual(result, [
    { name: 'B', released_at: '2025-12-11' },
    { name: 'A', released_at: '2024-12-12' },
  ])
  assert.deepEqual(versions, [
    { name: 'B', released_at: '2025-12-11' },
    { name: 'FUTURE', released_at: '2027-01-01' },
    { name: 'A', released_at: '2024-12-12' },
  ])
})

test('公開済みバージョンの短縮名を元の順序で返すこと', () => {
  // Given: 過去と未来のバージョンがある。
  const versions = [
    { name: 'CHUNITHM', released_at: '2015-07-16' },
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
    { name: 'CHUNITHM FUTURE', released_at: '2027-01-01' },
  ]

  // When: 基準日で短縮名を作る。
  const result = getReleasedVersionShortNames(versions, '2026-09-03')

  // Then: 未来分を除いた短縮名が元の順序で返る。
  assert.deepEqual(result, ['CHUNITHM', 'VERSE'])
})

test('新バージョンは稼働日のJST 07:00から公開済みになること', () => {
  // Given: 旧バージョンと、稼働日が2026-09-03の新バージョン。
  // 太平洋夏時間ではどちらの時刻も2026-09-02の午後になる。
  const versions = [
    { name: 'CHUNITHM X-VERSE', released_at: '2025-12-11' },
    { name: 'CHUNITHM X-VERSE-X', released_at: '2026-09-03' },
  ]
  const beforeDayStart = getTodayChunithmDate(new Date('2026-09-02T21:59:59Z'))
  const atDayStart = getTodayChunithmDate(new Date('2026-09-02T22:00:00Z'))

  // When: 稼働開始の直前と開始時刻で公開済みを絞る。
  const before = filterReleasedVersions(versions, beforeDayStart)
  const atStart = filterReleasedVersions(versions, atDayStart)

  // Then: 運用日はYYYY-MM-DD形式で切り替わり、公開済みバージョンにも反映する。
  assert.equal(beforeDayStart, '2026-09-02')
  assert.equal(atDayStart, '2026-09-03')
  assert.deepEqual(
    before.map((version) => version.name),
    ['CHUNITHM X-VERSE']
  )
  assert.deepEqual(
    atStart.map((version) => version.name),
    ['CHUNITHM X-VERSE', 'CHUNITHM X-VERSE-X']
  )
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

test('明示した基準日が当日の運用日と異なっても指定日で絞り込むこと', () => {
  // Given: 過去に稼働した2バージョンがある。
  const versions = [
    { name: 'CHUNITHM', released_at: '2015-07-16' },
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
  ]

  // When: 最初の稼働日の前日を基準日に指定する。
  const result = getReleasedVersionShortNames(versions, '2015-07-15')

  // Then: 当日の運用日ではなく指定日で絞られるため空になる。
  assert.deepEqual(result, [])
})

test('リリース日と稼働日が同じ日はそのバージョンを返すこと', () => {
  // Given: 稼働日が異なる2バージョンがある。
  const versions = [
    { name: 'CHUNITHM VERSE', released_at: '2024-12-12' },
    { name: 'CHUNITHM XCROSS', released_at: '2026-09-03' },
  ]

  // When: 新バージョンの稼働日当日で解決する。
  const result = resolveVersionNameByReleaseDate('2026-09-03', versions)

  // Then: 当日を含むため新バージョンになる。
  assert.equal(result, 'CHUNITHM XCROSS')
})
