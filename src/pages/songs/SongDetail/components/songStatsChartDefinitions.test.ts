import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CLEAR_CHART_DATASET_DEFINITIONS,
  COMBO_CHART_DATASET_DEFINITIONS,
} from './songStatsChartDefinitions.ts'

test('COMBOグラフ定義: どのコンボランプも未達成のNONEを先頭に表示する', () => {
  // Given: 楽曲詳細のCOMBOグラフ定義を利用する。
  const definitions = COMBO_CHART_DATASET_DEFINITIONS

  // When: グラフに表示するラベルを取得する。
  const labels = definitions.map((definition) => definition.label)

  // Then: NONEからFC、AJ、AJCの順で積み上げられる。
  assert.deepEqual(labels, ['NONE', 'FC', 'AJ', 'AJC'])
  assert.equal(definitions[0]?.valueKey, 'none')
  assert.equal(definitions[0]?.colorVariable, '--cs-color-score-rank-d-bg')
})

test('HARDグラフ定義: 未クリア者のFAILEDを先頭に表示する', () => {
  // Given: 楽曲詳細のHARDグラフ定義を利用する。
  const definitions = CLEAR_CHART_DATASET_DEFINITIONS

  // When: グラフに表示するラベルを取得する。
  const labels = definitions.map((definition) => definition.label)

  // Then: FAILEDから各ハードランプの順で積み上げられる。
  assert.deepEqual(labels, ['FAILED', 'CLEAR', 'HARD', 'BRAVE', 'ABSOLUTE', 'CATASTROPHY'])
  assert.equal(definitions[0]?.valueKey, 'failed')
  assert.equal(definitions[0]?.colorVariable, '--cs-color-score-rank-d-bg')
})
