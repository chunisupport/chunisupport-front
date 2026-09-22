import assert from 'node:assert/strict'
import test from 'node:test'
import type { FriendScoreComparisonItemDTO } from '../types/api'
import { filterFriendVsItems, sortFriendVsItems } from './friendVs'

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

test('未プレイの引き分けを保持し、両者プレイ済みだけを絞り込む', () => {
  // Given: 両者未プレイ、片方だけ、両者プレイ済みを含む比較。
  const items = [
    item('unplayed', 0, false, false),
    item('one', 100, true, false),
    item('both', -100, true, true),
  ]

  // When & Then: 引き分けと両者プレイ済みの意味を混同しない。
  assert.deepEqual(
    filterFriendVsItems(items, 'DRAW').map((row) => row.song.id),
    ['unplayed']
  )
  assert.deepEqual(
    filterFriendVsItems(items, 'BOTH_PLAYED').map((row) => row.song.id),
    ['both']
  )
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
