import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CHART_STATS_PATH,
  FRIEND_VS_PATH,
  LOCKED_SONG_DISCOVERY_PATH,
  ONLINE_WEAK_CHART_INSPECTOR_PATH,
} from './routes'
import { getToolLink, isPublicToolLink, isToolLinkListed, TOOL_LINKS, type ToolLink } from './tools'

const publicTool: ToolLink = {
  title: '公開ツール',
  href: '/tools/public',
  icon: 'chart',
  description: '公開ツールの説明',
}

const adminOnlyTool: ToolLink = {
  ...publicTool,
  title: '管理者限定ツール',
  href: '/tools/admin-only',
  adminOnly: true,
}

const disabledTool: ToolLink = {
  ...publicTool,
  title: '無効ツール',
  href: '/tools/disabled',
  disabled: true,
}

test('isToolLinkListed は通常ツールをアカウント種別に関係なく表示すること', () => {
  // Given
  const accountTypes = [undefined, 'PLAYER', 'EDITOR', 'ADMIN', 'EXTDEV'] as const

  // When & Then
  for (const accountType of accountTypes) {
    assert.equal(isToolLinkListed(publicTool, accountType), true)
  }
})

test('isToolLinkListed は ADMIN 限定ツールを管理者以外へ表示しないこと', () => {
  // Given
  const nonAdminAccountTypes = [undefined, 'PLAYER', 'EDITOR', 'EXTDEV'] as const

  // When & Then
  for (const accountType of nonAdminAccountTypes) {
    assert.equal(isToolLinkListed(adminOnlyTool, accountType), false)
  }
  assert.equal(isToolLinkListed(adminOnlyTool, 'ADMIN'), true)
})

test('isPublicToolLink は無効または ADMIN 限定のツールを公開対象外とすること', () => {
  // Given / When / Then
  assert.equal(isPublicToolLink(publicTool), true)
  assert.equal(isPublicToolLink(disabledTool), false)
  assert.equal(isPublicToolLink(adminOnlyTool), false)
})

test('未解禁曲ディスカバーは ADMIN 限定ツールとして定義されていること', () => {
  // Given
  const lockedSongDiscovery = TOOL_LINKS.find((tool) => tool.href === LOCKED_SONG_DISCOVERY_PATH)

  // When / Then
  assert.ok(lockedSongDiscovery)
  assert.equal(lockedSongDiscovery.adminOnly, true)
  assert.equal(isPublicToolLink(lockedSongDiscovery), false)
})

test('フレンドVSは通常ユーザーにも表示するツールとして定義されていること', () => {
  // Given
  const friendVs = getToolLink(FRIEND_VS_PATH)

  // When / Then
  assert.equal(friendVs.adminOnly, undefined)
  assert.equal(isPublicToolLink(friendVs), true)
  assert.equal(isToolLinkListed(friendVs, undefined), true)
  assert.equal(isToolLinkListed(friendVs, 'PLAYER'), true)
  assert.equal(isToolLinkListed(friendVs, 'ADMIN'), true)
})

test('苦手譜面インスペクター Online はログインユーザー向けの公開ツールとして定義されていること', () => {
  // Given
  const onlineWeakChartInspector = TOOL_LINKS.find(
    (tool) => tool.href === ONLINE_WEAK_CHART_INSPECTOR_PATH
  )

  // When / Then
  assert.ok(onlineWeakChartInspector)
  assert.equal(onlineWeakChartInspector.adminOnly, undefined)
  assert.equal(onlineWeakChartInspector.icon, 'globe')
  assert.equal(isPublicToolLink(onlineWeakChartInspector), true)
  assert.equal(isToolLinkListed(onlineWeakChartInspector, undefined), true)
  assert.equal(isToolLinkListed(onlineWeakChartInspector, 'PLAYER'), true)
})

test('レコード統計は公開ツールとして定義されていること', () => {
  // Given
  const chartStats = TOOL_LINKS.find((tool) => tool.href === CHART_STATS_PATH)

  // When / Then
  assert.ok(chartStats)
  assert.equal(isPublicToolLink(chartStats), true)
  assert.equal(isToolLinkListed(chartStats, undefined), true)
  assert.equal(isToolLinkListed(chartStats, 'PLAYER'), true)
  assert.equal(isToolLinkListed(chartStats, 'ADMIN'), true)
  assert.equal(chartStats.icon, 'distribution')
})

test('getToolLink はパスに対応するツール情報を返すこと', () => {
  // Given
  const target = TOOL_LINKS[0]
  assert.ok(target)

  // When
  const result = getToolLink(target.href)

  // Then
  assert.equal(result.title, target.title)
  assert.equal(result.description, target.description)
})

test('getToolLink は全ツールパスに対応するツール情報を返すこと', () => {
  // Given / When / Then
  for (const tool of TOOL_LINKS) {
    assert.equal(getToolLink(tool.href), tool)
  }
})

test('getToolLink は未知のパスでエラーをスローすること', () => {
  // Given
  const unknownPath = '/tools/unknown-tool-for-test'

  // When & Then
  assert.throws(() => getToolLink(unknownPath), new Error(`Unknown tool link: ${unknownPath}`))
})
