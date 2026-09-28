import assert from 'node:assert/strict'
import test from 'node:test'
import { buildUrlTabPath, resolveUrlTab } from './urlTab'

const SEGMENTS = { first: '', second: 'second-tab' } as const

test('セグメントが空文字のタブは基準パスそのもの、それ以外はセグメント付きのパスになること', () => {
  // Given
  const tabs = ['first', 'second'] as const

  // When
  const paths = tabs.map((tab) => buildUrlTabPath('/base', SEGMENTS, tab))

  // Then
  assert.deepEqual(paths, ['/base', '/base/second-tab'])
})

test('セグメントがない場合と空文字の場合は既定タブ、一致するセグメントは対応するタブを返すこと', () => {
  // Given
  const segments = [undefined, '', 'second-tab']

  // When
  const tabs = segments.map((segment) => resolveUrlTab(SEGMENTS, segment, 'first'))

  // Then
  assert.deepEqual(tabs, ['first', 'first', 'second'])
})

test('未対応のセグメントはnullを返すこと', () => {
  // Given
  const segment = 'unknown'

  // When
  const tab = resolveUrlTab(SEGMENTS, segment, 'first')

  // Then
  assert.equal(tab, null)
})
