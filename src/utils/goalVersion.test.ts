import assert from 'node:assert/strict'
import test from 'node:test'
import type { VersionDTO } from '../types/api'
import {
  buildGoalVersionNameMap,
  buildGoalVersionOptions,
  resolveGoalVersionValueByReleaseDate,
} from './goalVersion'

const versions: VersionDTO[] = [
  { id: 99, name: 'CHUNITHM SUN', short_name: 'SUN', released_at: '2022-10-13' },
  { id: 10, name: 'CHUNITHM NEW', short_name: 'NEW', released_at: '2021-11-04' },
  { id: 50, name: 'CHUNITHM LUMINOUS', short_name: 'LMN', released_at: '2023-12-14' },
]

test('目標条件のバージョン値はDB IDではなくリリース日順の番号を使う', () => {
  assert.deepEqual(buildGoalVersionOptions(versions), [
    { value: '1', numericValue: 1, label: 'NEW' },
    { value: '2', numericValue: 2, label: 'SUN' },
    { value: '3', numericValue: 3, label: 'LUMINOUS' },
  ])
})

test('バージョン表示名Mapはリリース日順番号から名前を引ける', () => {
  const nameMap = buildGoalVersionNameMap(versions)

  assert.equal(nameMap.get(1), 'NEW')
  assert.equal(nameMap.get(2), 'SUN')
  assert.equal(nameMap.get(3), 'LUMINOUS')
})

test('曲のリリース日は直近のバージョンのリリース日順番号へ解決される', () => {
  assert.equal(resolveGoalVersionValueByReleaseDate('2022-12-01', versions), 2)
  assert.equal(resolveGoalVersionValueByReleaseDate('2024-01-01', versions), 3)
  assert.equal(resolveGoalVersionValueByReleaseDate('invalid', versions), undefined)
})

test('未来バージョンは選択肢から除外され、公開済みの番号は変わらない', () => {
  // Given: 未来バージョンを含む一覧がある。
  const withFuture: VersionDTO[] = [
    ...versions,
    { id: 77, name: 'CHUNITHM FUTURE', short_name: 'FUT', released_at: '2027-01-01' },
  ]

  // When: 基準日を指定して選択肢を作る。
  const result = buildGoalVersionOptions(withFuture, '2026-09-03')

  // Then: 未来分が除かれ、公開済みの番号は不変である。
  assert.deepEqual(result, [
    { value: '1', numericValue: 1, label: 'NEW' },
    { value: '2', numericValue: 2, label: 'SUN' },
    { value: '3', numericValue: 3, label: 'LUMINOUS' },
  ])
})

test('同じリリース日を繰り返し解決しても、バージョン一覧ごとに正しい番号を返す', () => {
  // Given: 同じリリース日を、新しいバージョンを追加した別の一覧でも解決する。
  const withNewVersion: VersionDTO[] = [
    ...versions,
    { id: 60, name: 'CHUNITHM VERSE', short_name: 'VRS', released_at: '2024-12-12' },
  ]

  // When: キャッシュ済みの一覧と別の一覧で同じ日付を解決する。
  const first = resolveGoalVersionValueByReleaseDate('2025-01-01', versions)
  const cached = resolveGoalVersionValueByReleaseDate('2025-01-01T00:00:00Z', versions)
  const otherList = resolveGoalVersionValueByReleaseDate('2025-01-01', withNewVersion)

  // Then: 一覧ごとに解決され、キャッシュが別の一覧へ漏れない。
  assert.equal(first, 3)
  assert.equal(cached, 3)
  assert.equal(otherList, 4)
})
