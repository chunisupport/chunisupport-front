import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_FILTER } from './recordFilterDefaults'
import {
  matchesRecordFilterLevelSet,
  omitRecordFilterLevelSet,
  resetRecordFilterLevelSetOnConstChange,
} from './recordFilterLevelSet'

test('レベル指定がなければすべての譜面定数を対象にする', () => {
  // Given, When, Then
  assert.equal(matchesRecordFilterLevelSet(13.2, undefined), true)
})

test('離れた複数レベルを指定した場合はそのレベルの譜面だけを対象にする', () => {
  // Given
  const levelSet = ['13', '14+'] as const

  // When, Then
  assert.equal(matchesRecordFilterLevelSet(13.4, levelSet), true)
  assert.equal(matchesRecordFilterLevelSet(14.7, levelSet), true)
  assert.equal(matchesRecordFilterLevelSet(13.5, levelSet), false)
  assert.equal(matchesRecordFilterLevelSet(14.0, levelSet), false)
})

test('保存用にレベル指定を取り除く', () => {
  // Given
  const filter = { ...DEFAULT_FILTER, levelSet: ['14+' as const] }

  // When
  const result = omitRecordFilterLevelSet(filter)

  // Then
  assert.equal('levelSet' in result, false)
})

test('譜面定数の範囲が変更されたらレベル指定をリセットする', () => {
  // Given
  const previous = { ...DEFAULT_FILTER, levelSet: ['14+' as const] }
  const next = { ...previous, const: { ...previous.const, min: 14 } }

  // When
  const result = resetRecordFilterLevelSetOnConstChange(previous, next)

  // Then
  assert.equal(result.levelSet, undefined)
})

test('譜面定数の指定方法が変更されたらレベル指定をリセットする', () => {
  // Given
  const previous = { ...DEFAULT_FILTER, levelSet: ['14+' as const] }
  const next = { ...previous, constFilterMode: 'number' as const }

  // When, Then
  assert.equal(resetRecordFilterLevelSetOnConstChange(previous, next).levelSet, undefined)
})

test('譜面定数以外の変更ではレベル指定を維持する', () => {
  // Given
  const previous = { ...DEFAULT_FILTER, levelSet: ['14+' as const] }
  const next = { ...previous, genres: ['POPS & ANIME'] }

  // When, Then
  assert.deepEqual(resetRecordFilterLevelSetOnConstChange(previous, next).levelSet, ['14+'])
})
