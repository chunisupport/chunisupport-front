import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSongDetailPath,
  buildWorldsendScoreHistoryPath,
  buildWorldsendSongDetailPath,
  isScoreHistoryFromSongDetailState,
  SCORE_HISTORY_FROM_SONG_DETAIL_STATE,
} from './routes'

test('通常楽曲詳細パスは表示IDと難易度をエンコードする', () => {
  // Given: URLエンコードが必要な表示IDと大文字難易度。
  const displayId = 'A/B C'

  // When: 通常楽曲詳細パスを生成する。
  const result = buildSongDetailPath(displayId, 'ULTIMA')

  // Then: 表示IDはエンコードされ、難易度はクエリ向けに小文字化される。
  assert.equal(result, '/songs/A%2FB%20C?diff=ultima')
})

test("WORLD'S END 楽曲詳細パスは表示IDをエンコードする", () => {
  // Given: URLエンコードが必要な表示ID。
  const displayId = 'A/B C'

  // When: WORLD'S END 楽曲詳細パスを生成する。
  const result = buildWorldsendSongDetailPath(displayId)

  // Then: WORLD'S END 用の詳細パスが生成される。
  assert.equal(result, '/songs/worldsend/A%2FB%20C')
})

test("WORLD'S END スコア履歴パスは表示IDをエンコードする", () => {
  // Given: URL 予約文字と空白を含む表示ID。
  const displayId = 'A/B C'

  // When: WORLD'S END スコア履歴パスを生成する。
  const result = buildWorldsendScoreHistoryPath(displayId)

  // Then: 表示IDがパス要素として安全にエンコードされる。
  assert.equal(result, '/songs/worldsend/A%2FB%20C/score-history')
})

test('楽曲詳細からスコア履歴へ遷移した state を判定する', () => {
  // Given: 楽曲詳細からの遷移 state。
  const state = SCORE_HISTORY_FROM_SONG_DETAIL_STATE

  // When: state を判定する。
  const result = isScoreHistoryFromSongDetailState(state)

  // Then: 楽曲詳細からの遷移として扱われる。
  assert.equal(result, true)
})

test('異なる state は楽曲詳細からのスコア履歴遷移として扱わない', () => {
  // Given: 別画面から渡された state。
  const state = { source: 'record' }

  // When: state を判定する。
  const result = isScoreHistoryFromSongDetailState(state)

  // Then: 楽曲詳細からの遷移として扱われない。
  assert.equal(result, false)
})
