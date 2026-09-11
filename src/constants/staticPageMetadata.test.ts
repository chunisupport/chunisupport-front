import assert from 'node:assert/strict'
import test from 'node:test'
import { STATIC_PAGE_METADATA } from './staticPageMetadata'
import { TOOL_LINKS } from './tools'

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

test('公開中の全ツールだけを固定ページ生成対象に含めること', () => {
  // Given
  const generatedPaths = new Set(STATIC_PAGE_METADATA.map((page) => page.path))

  // When & Then
  for (const tool of TOOL_LINKS) {
    assert.equal(generatedPaths.has(tool.href), tool.disabled !== true)
  }
})
