import assert from 'node:assert/strict'
import test from 'node:test'

import { CHART_CONST_MAX } from '../../../../constants/chart.ts'
import { MAX_SCORE } from '../../../../utils/scoreRank.ts'
import { DEFAULT_FILTER } from '../types/filterDefaults.ts'
import {
  parseFilterRangeQuery,
  parseScoreRangeQuery,
  serializeFilterRangeQuery,
  serializeScoreRangeQuery,
} from './filterQuery.ts'

test('serializeFilterRangeQuery は範囲フィルターをフラットなクエリ値へ変換すること', () => {
  // Given
  const filter = {
    ...DEFAULT_FILTER,
    const: {
      min: 14,
      max: 15.5,
    },
    score: {
      min: 1_007_000,
      max: 1_008_000,
    },
    justiceCount: {
      min: 1,
      max: null,
    },
    overPower: {
      min: 80.123,
      max: 95,
    },
  }

  // When
  const result = serializeFilterRangeQuery(filter)

  // Then
  assert.deepEqual(result, {
    constMin: '14',
    constMax: '15.5',
    scoreMin: '1007000',
    scoreMax: '1008000',
    justiceCountMin: '1',
    justiceCountMax: undefined,
    overPowerMin: '80.123',
    overPowerMax: '95',
  })
})

test('serializeFilterRangeQuery はデフォルト値をクエリから省略すること', () => {
  // Given, When
  const result = serializeFilterRangeQuery(DEFAULT_FILTER)

  // Then
  assert.deepEqual(result, {
    constMin: undefined,
    constMax: undefined,
    scoreMin: undefined,
    scoreMax: undefined,
    justiceCountMin: undefined,
    justiceCountMax: undefined,
    overPowerMin: undefined,
    overPowerMax: undefined,
  })
})

test('serializeScoreRangeQuery はスコア範囲をフラットなクエリ値へ変換すること', () => {
  // Given
  const filter = {
    ...DEFAULT_FILTER,
    score: {
      min: 1_007_000,
      max: 1_008_000,
    },
  }

  // When
  const result = serializeScoreRangeQuery(filter)

  // Then
  assert.deepEqual(result, {
    scoreMin: '1007000',
    scoreMax: '1008000',
  })
})

test('serializeScoreRangeQuery はデフォルト値をクエリから省略すること', () => {
  // Given, When
  const result = serializeScoreRangeQuery(DEFAULT_FILTER)

  // Then
  assert.deepEqual(result, {
    scoreMin: undefined,
    scoreMax: undefined,
  })
})

test('parseScoreRangeQuery はフラットなクエリ値を内部スコア範囲へ変換すること', () => {
  // Given
  const fallback = DEFAULT_FILTER.score

  // When
  const result = parseScoreRangeQuery({ scoreMin: '1007000', scoreMax: '1008000' }, fallback)

  // Then
  assert.deepEqual(result, {
    min: 1_007_000,
    max: 1_008_000,
  })
})

test('parseScoreRangeQuery は不正値をフォールバックしスコア上限で丸めること', () => {
  // Given
  const fallback = DEFAULT_FILTER.score

  // When
  const result = parseScoreRangeQuery({ scoreMin: 'invalid', scoreMax: '9999999' }, fallback)

  // Then
  assert.deepEqual(result, {
    min: fallback.min,
    max: MAX_SCORE,
  })
})

test('parseFilterRangeQuery はフラットなクエリ値を内部範囲フィルターへ変換すること', () => {
  // Given
  const fallback = DEFAULT_FILTER

  // When
  const result = parseFilterRangeQuery(
    {
      constMin: '14',
      constMax: '99',
      scoreMin: '1007000',
      scoreMax: '1008000',
      justiceCountMin: '1',
      justiceCountMax: '1.5',
      overPowerMin: '80.1234',
      overPowerMax: '',
    },
    fallback
  )

  // Then
  assert.deepEqual(result, {
    const: {
      min: 14,
      max: CHART_CONST_MAX,
    },
    score: {
      min: 1_007_000,
      max: 1_008_000,
    },
    justiceCount: {
      min: 1,
      max: fallback.justiceCount.max,
    },
    overPower: {
      min: 80.123,
      max: fallback.overPower.max,
    },
  })
})
