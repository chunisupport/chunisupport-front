import assert from 'node:assert/strict'
import test from 'node:test'
import { CHART_STATS_PATH } from './routes'
import { isToolLinkListed, TOOL_LINKS } from './tools'

test('レコード統計は ADMIN のツール一覧だけに表示すること', () => {
  // Given
  const chartStats = TOOL_LINKS.find((tool) => tool.href === CHART_STATS_PATH)

  // When & Then
  assert.ok(chartStats)
  assert.equal(isToolLinkListed(chartStats, undefined), false)
  assert.equal(isToolLinkListed(chartStats, 'PLAYER'), false)
  assert.equal(isToolLinkListed(chartStats, 'EDITOR'), false)
  assert.equal(isToolLinkListed(chartStats, 'EXTDEV'), false)
  assert.equal(isToolLinkListed(chartStats, 'ADMIN'), true)
})
