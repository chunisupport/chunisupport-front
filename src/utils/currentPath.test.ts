import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCurrentPath } from './currentPath'

test('パス名・クエリ・ハッシュを連結した現在のパスを組み立てること', () => {
  // Given
  const parts = { pathname: '/users/tester', search: '?tab=records', hash: '#top' }

  // When
  const result = buildCurrentPath(parts)

  // Then
  assert.equal(result, '/users/tester?tab=records#top')
})

test('クエリとハッシュが空の場合はパス名のみを返すこと', () => {
  // Given
  const parts = { pathname: '/goals', search: '', hash: '' }

  // When
  const result = buildCurrentPath(parts)

  // Then
  assert.equal(result, '/goals')
})

test('ハッシュのみのURLでも各要素を欠落なく連結すること', () => {
  // Given
  const parts = { pathname: '/', search: '', hash: '#section-2' }

  // When
  const result = buildCurrentPath(parts)

  // Then
  assert.equal(result, '/#section-2')
})
