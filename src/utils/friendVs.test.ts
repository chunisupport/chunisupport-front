import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  FriendScoreComparisonItemDTO,
  WorldsendFriendScoreComparisonItemDTO,
} from '../types/api'
import {
  filterFriendVsItems,
  getFriendVsChartDisplay,
  getFriendVsSongPath,
  sortFriendVsItems,
  summarizeFriendVsMatches,
} from './friendVs'

/**
 * スコア差とプレイ状態を指定した比較行を生成する。
 *
 * @param id - 楽曲表示ID。
 * @param difference - 自分から相手を引いたスコア差。
 * @param selfPlayed - 自分のレコード有無。
 * @param friendPlayed - 相手のレコード有無。
 * @returns フィルター確認に必要な比較行。
 */
const item = (
  id: string,
  difference: number,
  selfPlayed: boolean,
  friendPlayed: boolean
): FriendScoreComparisonItemDTO => ({
  song: { id, title: id, artist: '' },
  chart: { const: 14, is_const_unknown: false },
  self: {
    is_played: selfPlayed,
    score: selfPlayed ? difference + 100 : 0,
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
    updated_at: null,
  },
  friend: {
    is_played: friendPlayed,
    score: friendPlayed ? 100 : 0,
    clear_lamp: null,
    combo_lamp: null,
    full_chain: null,
    updated_at: null,
  },
  score_difference: difference,
  result: difference > 0 ? 'SELF_WIN' : difference < 0 ? 'FRIEND_WIN' : 'DRAW',
})

test('未挑戦の同点を除き、双方が挑戦した譜面だけを絞り込む', () => {
  // Given: 両者未プレイ、片方だけ、両者プレイ済みを含む比較。
  const items = [
    item('unplayed', 0, false, false),
    item('one', 100, true, false),
    item('both', -100, true, true),
  ]

  // When & Then: 未挑戦の同点は対戦結果に含めない。
  assert.deepEqual(
    filterFriendVsItems(items, 'DRAW', false).map((row) => row.song.id),
    []
  )
  assert.deepEqual(
    filterFriendVsItems(items, 'SELF_WIN', false).map((row) => row.song.id),
    []
  )
  assert.deepEqual(
    filterFriendVsItems(items, 'ALL', true).map((row) => row.song.id),
    ['both']
  )
  assert.deepEqual(
    filterFriendVsItems(items, 'ALL', false).map((row) => row.song.id),
    ['unplayed', 'one', 'both']
  )
})

test('双方が挑戦した譜面だけを対戦結果として数える', () => {
  // Given: 双方未挑戦と片方のみ挑戦した譜面も含む。
  const items = [
    item('unplayed', 0, false, false),
    item('selfOnly', 100, true, false),
    item('selfWin', 100, true, true),
    item('draw', 0, true, true),
    item('friendWin', -100, true, true),
  ]

  // When: 対戦結果を集計する。
  const summary = summarizeFriendVsMatches(items)

  // Then: 未挑戦と片方だけの譜面は勝敗から除く。
  assert.deepEqual(summary, { total: 3, selfWins: 1, draws: 1, friendWins: 1 })
})

test('各ヘッダーで昇順・降順に並び替え、解除時はAPI順に戻す', () => {
  // Given: 楽曲順と各数値列の順序が異なる比較行。
  const items = [
    item('zeta', -100, true, true),
    item('alpha', 300, true, true),
    item('beta', 200, true, false),
  ]
  items[0].chart.const = 13
  items[1].chart.const = 15

  // When & Then: 各列の値で並び替え、元のAPI順を変更しない。
  assert.deepEqual(
    sortFriendVsItems(items, 'title', 'asc').map((row) => row.song.id),
    ['alpha', 'beta', 'zeta']
  )
  assert.deepEqual(
    sortFriendVsItems(items, 'const', 'desc').map((row) => row.song.id),
    ['alpha', 'beta', 'zeta']
  )
  assert.deepEqual(
    sortFriendVsItems(items, 'selfScore', 'asc').map((row) => row.song.id),
    ['zeta', 'beta', 'alpha']
  )
  assert.deepEqual(
    sortFriendVsItems(items, 'friendScore', 'desc').map((row) => row.song.id),
    ['zeta', 'alpha', 'beta']
  )
  assert.deepEqual(
    sortFriendVsItems(items, 'difference', 'desc').map((row) => row.song.id),
    ['alpha', 'beta', 'zeta']
  )
  assert.deepEqual(
    sortFriendVsItems(items, null, null).map((row) => row.song.id),
    ['zeta', 'alpha', 'beta']
  )
  assert.deepEqual(
    items.map((row) => row.song.id),
    ['zeta', 'alpha', 'beta']
  )
})

test("WORLD'S ENDの星数・属性と楽曲リンクを使い、星数順に並べる", () => {
  // Given: 星数と属性が設定済み・未設定の比較行。
  const missing: WorldsendFriendScoreComparisonItemDTO = {
    ...item('missing', 0, false, false),
    chart: { level_star: null, attribute: null },
  }
  const known: WorldsendFriendScoreComparisonItemDTO = {
    ...item('known', 10, true, true),
    chart: { level_star: 4, attribute: '蔵' },
  }

  // When & Then: 欠損値も表示し、WORLD'S END詳細へ遷移する。
  assert.equal(getFriendVsChartDisplay(missing).valueText, '★-')
  assert.equal(getFriendVsChartDisplay(known).valueText, '★4 蔵')
  assert.equal(getFriendVsSongPath(known, "WORLD'S END"), '/songs/worldsend/known')
  assert.deepEqual(
    sortFriendVsItems([missing, known], 'const', 'desc').map((row) => row.song.id),
    ['known', 'missing']
  )
  assert.deepEqual(
    filterFriendVsItems([missing, known], 'ALL', true).map((row) => row.song.id),
    ['known']
  )
})
