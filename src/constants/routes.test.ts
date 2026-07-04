import assert from 'node:assert/strict'
import test from 'node:test'
import { buildWorldsendScoreHistoryPath } from './routes'

test("WORLD'S END スコア履歴パスは表示IDをエンコードする", () => {
  // Given: URL 予約文字と空白を含む表示ID。
  const displayId = 'A/B C'

  // When: WORLD'S END スコア履歴パスを生成する。
  const result = buildWorldsendScoreHistoryPath(displayId)

  // Then: 表示IDがパス要素として安全にエンコードされる。
  assert.equal(result, '/songs/worldsend/A%2FB%20C/score-history')
})
