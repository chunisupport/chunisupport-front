import assert from 'node:assert/strict'
import test from 'node:test'
import { SONGS_PATH, WORLDSEND_SONGS_PATH } from './routes'
import { STATIC_PAGE_METADATA } from './staticPageMetadata'
import { isPublicToolLink, TOOL_LINKS } from './tools'

test('固定ページのパスが重複せず、タイトルと説明が空ではないこと', () => {
  // Given
  const paths = STATIC_PAGE_METADATA.map((page) => page.path)

  // When
  const uniquePaths = new Set(paths)

  // Then
  assert.equal(uniquePaths.size, paths.length)
  for (const page of STATIC_PAGE_METADATA) {
    assert.ok(page.title.length > 0)
    assert.ok(page.description.length > 0)
  }
})

test('公開ツールを固定ページ生成対象に含めること', () => {
  // Given
  const generatedPaths = new Set(STATIC_PAGE_METADATA.map((page) => page.path))

  // When
  const publicTools = TOOL_LINKS.filter(isPublicToolLink)

  // Then: 公開ツールのメタ情報を収録し、非公開ツールは収録しない。
  for (const tool of TOOL_LINKS) {
    assert.equal(generatedPaths.has(tool.href), isPublicToolLink(tool))
  }
  for (const tool of publicTools) {
    assert.deepEqual(
      STATIC_PAGE_METADATA.find((page) => page.path === tool.href),
      { path: tool.href, title: tool.title, description: tool.description }
    )
  }
})

for (const expected of [
  {
    path: '/tools',
    title: 'ツール',
    description: 'CHUNITHM のプレイや目標設定に役立つ計算・分析ツールを利用できます。',
  },
  {
    path: '/tools/friend-vs',
    title: 'フレンドVS',
    description: 'フレンドとスコアで勝負。',
  },
  {
    path: '/tools/border-calculator',
    title: 'ボーダー計算機',
    description: '楽曲と譜面を選び、目標スコアまでの許容判定数を計算します。',
  },
]) {
  test(`${expected.path} の固定ページに対応するタイトルと説明を収録すること`, () => {
    // Given: 代表ページのパス。
    const path = expected.path

    // When: 固定ページのメタ情報を検索する。
    const result = STATIC_PAGE_METADATA.find((page) => page.path === path)

    // Then: 同じページのタイトルと説明が組になっている。
    assert.deepEqual(result, expected)
  })
}

test('楽曲一覧の固定ページを生成対象に含めること', () => {
  // Given
  const generatedPaths = new Set(STATIC_PAGE_METADATA.map((page) => page.path))

  // When & Then
  assert.equal(generatedPaths.has(SONGS_PATH), true)
  assert.equal(generatedPaths.has(WORLDSEND_SONGS_PATH), true)
})
