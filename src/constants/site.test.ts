import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDocumentTitle, joinDocumentTitleParts, SITE_NAME } from './site'

test('ページ名とサービス名を縦線で区切ること', () => {
  // Given
  const pageTitle = '楽曲一覧'

  // When
  const title = buildDocumentTitle(pageTitle)

  // Then
  assert.equal(title, `楽曲一覧 | ${SITE_NAME}`)
})

test('ページ名がない場合はサービス名だけを返すこと', () => {
  // Given
  const pageTitle = undefined

  // When
  const title = buildDocumentTitle(pageTitle)

  // Then
  assert.equal(title, SITE_NAME)
})

test('複数のタイトル要素を縦線で区切ること', () => {
  // Given
  const parts = ['楽曲名', '楽曲詳細']

  // When
  const title = joinDocumentTitleParts(...parts)

  // Then
  assert.equal(title, '楽曲名 | 楽曲詳細')
})
