import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSongYoutubeSearchUrl } from './youtube.ts'

test('楽曲名をダブルクォーテーションで囲んだ検索URLを組み立てること', () => {
  // Given: スペースを含みハイフンで始まる部分を持つ楽曲名。
  const songTitle = '業 -善なる神とこの世の悪について-'

  // When: YouTube検索URLを組み立てる。
  const result = buildSongYoutubeSearchUrl(songTitle)

  // Then: 検索クエリはCHUNITHMと引用符付きの楽曲名になる。
  const url = new URL(result)
  assert.equal(url.origin + url.pathname, 'https://www.youtube.com/results')
  assert.equal(url.searchParams.get('search_query'), 'CHUNITHM "業 -善なる神とこの世の悪について-"')
})

test('記号を含む楽曲名がエンコードされること', () => {
  // Given: クエリ区切りとして解釈されうる記号を含む楽曲名。
  const songTitle = 'A&B #1?'

  // When: YouTube検索URLを組み立てる。
  const result = buildSongYoutubeSearchUrl(songTitle)

  // Then: 記号はエンコードされ、検索クエリとして復元できる。
  assert.equal(result, 'https://www.youtube.com/results?search_query=CHUNITHM+%22A%26B+%231%3F%22')
})
