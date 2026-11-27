import assert from 'node:assert/strict'
import test from 'node:test'
import type { VersionDTO } from '../types/api'
import {
  buildGoalVersionNameMap,
  buildGoalVersionOptions,
  resolveGoalVersionIdByReleaseDate,
} from './goalVersion'

const versions: VersionDTO[] = [
  { id: 'c0ffee0000000099', name: 'CHUNITHM SUN', short_name: 'SUN', released_at: '2022-10-13' },
  { id: 'c0ffee0000000010', name: 'CHUNITHM NEW', short_name: 'NEW', released_at: '2021-11-04' },
  {
    id: 'c0ffee0000000050',
    name: 'CHUNITHM LUMINOUS',
    short_name: 'LMN',
    released_at: '2023-12-14',
  },
]

test('目標条件のバージョン値はDB IDではなくバージョンの公開IDをリリース日順に使う', () => {
  assert.deepEqual(buildGoalVersionOptions(versions), [
    { value: 'c0ffee0000000010', label: 'NEW' },
    { value: 'c0ffee0000000099', label: 'SUN' },
    { value: 'c0ffee0000000050', label: 'LUMINOUS' },
  ])
})

test('バージョン表示名Mapは公開IDから名前を引ける', () => {
  const nameMap = buildGoalVersionNameMap(versions)

  assert.equal(nameMap.get('c0ffee0000000010'), 'NEW')
  assert.equal(nameMap.get('c0ffee0000000099'), 'SUN')
  assert.equal(nameMap.get('c0ffee0000000050'), 'LUMINOUS')
})

test('曲のリリース日は直近のバージョンの公開IDへ解決される', () => {
  assert.equal(resolveGoalVersionIdByReleaseDate('2022-12-01', versions), 'c0ffee0000000099')
  assert.equal(resolveGoalVersionIdByReleaseDate('2024-01-01', versions), 'c0ffee0000000050')
  assert.equal(resolveGoalVersionIdByReleaseDate('invalid', versions), undefined)
})

test('バージョンのリリース日当日はそのバージョンの公開IDへ解決される', () => {
  // Given: SUNのリリース日当日の楽曲。
  const releaseDate = '2022-10-13'

  // When
  const result = resolveGoalVersionIdByReleaseDate(releaseDate, versions)

  // Then: 当日のバージョンになる。
  assert.equal(result, 'c0ffee0000000099')
})

test('未来バージョンは選択肢から除外され、公開済みの値は変わらない', () => {
  // Given: 未来バージョンを含む一覧がある。
  const withFuture: VersionDTO[] = [
    ...versions,
    {
      id: 'c0ffee0000000077',
      name: 'CHUNITHM FUTURE',
      short_name: 'FUT',
      released_at: '2027-01-01',
    },
  ]

  // When: 基準日を指定して選択肢を作る。
  const result = buildGoalVersionOptions(withFuture, '2026-09-03')

  // Then: 未来分が除かれ、公開済みの値は不変である。
  assert.deepEqual(result, [
    { value: 'c0ffee0000000010', label: 'NEW' },
    { value: 'c0ffee0000000099', label: 'SUN' },
    { value: 'c0ffee0000000050', label: 'LUMINOUS' },
  ])
})

test('同じリリース日を繰り返し解決しても、バージョン一覧ごとに正しい公開IDを返す', () => {
  // Given: 同じリリース日を、新しいバージョンを追加した別の一覧でも解決する。
  const withNewVersion: VersionDTO[] = [
    ...versions,
    {
      id: 'c0ffee0000000060',
      name: 'CHUNITHM VERSE',
      short_name: 'VRS',
      released_at: '2024-12-12',
    },
  ]

  // When: キャッシュ済みの一覧と別の一覧で同じ日付を解決する。
  const first = resolveGoalVersionIdByReleaseDate('2025-01-01', versions)
  const cached = resolveGoalVersionIdByReleaseDate('2025-01-01T00:00:00Z', versions)
  const otherList = resolveGoalVersionIdByReleaseDate('2025-01-01', withNewVersion)

  // Then: 一覧ごとに解決され、キャッシュが別の一覧へ漏れない。
  assert.equal(first, 'c0ffee0000000050')
  assert.equal(cached, 'c0ffee0000000050')
  assert.equal(otherList, 'c0ffee0000000060')
})
