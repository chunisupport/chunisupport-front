import assert from 'node:assert/strict'
import test from 'node:test'
import { WEAK_CHART_TOOLTIP_TITLE_CLASS } from './weakChartInspector.constants.ts'

test('ツールチップの曲名クラスはSans系フォントを含む', () => {
  // Given: 苦手譜面インスペクターのグラフツールチップ曲名クラス。
  const titleClass = WEAK_CHART_TOOLTIP_TITLE_CLASS

  // When: 適用予定のクラス一覧を確認する。
  const classes = titleClass.split(' ')

  // Then: Sans系フォント指定が含まれている。
  assert.ok(classes.includes('font-sans'))
})
