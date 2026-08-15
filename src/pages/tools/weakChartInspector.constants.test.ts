import assert from 'node:assert/strict'
import test from 'node:test'
import { THEORETICAL_OVER_POWER_TARGET_LABEL } from '../../constants/chart'
import { WEAK_CHART_OP_TARGET_FILTER } from '../../utils/weakChartInspector'
import {
  WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT,
  WEAK_CHART_AGGREGATION_DIFFICULTY_OPTIONS,
  WEAK_CHART_TOOLTIP_TITLE_CLASS,
} from './weakChartInspector.constants.ts'

test('ツールチップの曲名クラスはSans系フォントを含む', () => {
  // Given: 苦手譜面インスペクターのグラフツールチップ曲名クラス。
  const titleClass = WEAK_CHART_TOOLTIP_TITLE_CLASS

  // Then: 期待するクラス文字列と一致する。
  assert.equal(titleClass, 'font-sans font-semibold text-text')
})

test('集計対象難易度は理論値OP対象を先頭の選択肢に含む', () => {
  // Given: 苦手譜面インスペクターの集計対象難易度選択肢。
  const firstOption = WEAK_CHART_AGGREGATION_DIFFICULTY_OPTIONS[0]

  // Then: 理論値OP対象の値と共通表示名が設定されている。
  assert.deepEqual(firstOption, {
    value: WEAK_CHART_OP_TARGET_FILTER,
    label: THEORETICAL_OVER_POWER_TARGET_LABEL,
  })
})

test('集計対象難易度の初期値は通常のMASTERとULTIMAを維持する', () => {
  // Given: 苦手譜面インスペクターの集計対象難易度初期値。
  const defaults = WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT

  // Then: 理論値OP対象へ変更せず、従来の2難易度を選択する。
  assert.deepEqual(defaults, ['MASTER', 'ULTIMA'])
})
