import assert from 'node:assert/strict'
import test from 'node:test'
import { ONLINE_WEAK_CHART_INSPECTOR_PATH } from './routes'
import { isToolLinkListed, TOOL_LINKS } from './tools'

test('Online は管理者のツール一覧にだけ表示する', () => {
  // Given
  const online = TOOL_LINKS.find((tool) => tool.href === ONLINE_WEAK_CHART_INSPECTOR_PATH)
  assert.ok(online)

  // When / Then
  assert.equal(online.adminOnly, true)
  assert.equal(isToolLinkListed(online, undefined), false)
  assert.equal(isToolLinkListed(online, 'PLAYER'), false)
  assert.equal(isToolLinkListed(online, 'EDITOR'), false)
  assert.equal(isToolLinkListed(online, 'ADMIN'), true)
})

test('通常ツールはアカウント種別を問わず一覧に表示する', () => {
  // Given
  const standard = TOOL_LINKS.find((tool) => tool.title === '苦手譜面インスペクター')
  assert.ok(standard)

  // When / Then
  assert.equal(isToolLinkListed(standard, undefined), true)
  assert.equal(isToolLinkListed(standard, 'PLAYER'), true)
})
