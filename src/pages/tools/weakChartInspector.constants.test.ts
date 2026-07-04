import assert from 'node:assert/strict'
import test from 'node:test'
import { WEAK_CHART_TOOLTIP_TITLE_CLASS } from './weakChartInspector.constants.ts'

test('ツールチップの曲名クラスはSans系フォントを含む', () => {
  // Given: 苦手譜面インスペクターのグラフツールチップ曲名クラス。
  const titleClass = WEAK_CHART_TOOLTIP_TITLE_CLASS

  // Then: 期待するクラス文字列と一致する。
  assert.equal(titleClass, 'font-sans font-semibold text-text')
})
