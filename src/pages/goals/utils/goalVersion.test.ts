import assert from 'node:assert/strict'
import test from 'node:test'
import type { VersionDTO } from '../../../types/api.ts'
import {
  buildGoalVersionNameMap,
  buildGoalVersionOptions,
  resolveGoalVersionValueByReleaseDate,
} from './goalVersion.ts'

const versions: VersionDTO[] = [
  { id: 99, name: 'CHUNITHM SUN', released_at: '2022-10-13' },
  { id: 10, name: 'CHUNITHM NEW', released_at: '2021-11-04' },
  { id: 50, name: 'CHUNITHM LUMINOUS', released_at: '2023-12-14' },
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
