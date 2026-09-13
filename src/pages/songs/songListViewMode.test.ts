import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_SONG_LIST_VIEW_MODE } from './constants'
import { songListViewMode } from './songListViewMode'

test('楽曲一覧の初期表示形式はカードである', () => {
  // Given: アプリ起動直後の楽曲一覧表示状態。
  // When: 現在の表示形式を参照する。
  const result = songListViewMode()

  // Then: 既定値と現在値がともにカード表示になる。
  assert.equal(DEFAULT_SONG_LIST_VIEW_MODE, 'card')
  assert.equal(result, 'card')
})
