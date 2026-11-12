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
  song: { id, title: id, reading: null, artist: '' },
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

for (const { label, filter, expectedIds } of [
  { label: '自分の勝ち', filter: 'SELF_WIN', expectedIds: ['selfWin'] },
  { label: '引き分け', filter: 'DRAW', expectedIds: ['draw'] },
  { label: '相手の勝ち', filter: 'FRIEND_WIN', expectedIds: ['friendWin'] },
] as const) {
  for (const excludeUnplayed of [false, true]) {
    test(`${label}を指定すると該当する対戦済みの行だけが残る（未プレイ除外: ${excludeUnplayed}）`, () => {
      // Given: 各勝敗と、片方または双方が未プレイの比較行。
      const items = [
        item('unplayed', 0, false, false),
        item('selfOnly', 100, true, false),
        item('friendOnly', -100, false, true),
        item('selfWin', 100, true, true),
        item('draw', 0, true, true),
        item('friendWin', -100, true, true),
      ]

      // When: 勝敗を指定して比較行を絞り込む。
      const result = filterFriendVsItems(items, filter, excludeUnplayed)

      // Then: 指定した勝敗の対戦済み行が残り、それ以外は含まれない。
      assert.deepEqual(
        result.map((row) => row.song.id),
        expectedIds
      )
    })
  }
}

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

for (const { label, key, direction, expectedIds } of [
  {
    label: '曲名の昇順',
    key: 'title',
    direction: 'asc',
    expectedIds: ['alpha', 'beta', 'gamma', 'zeta'],
  },
  {
    label: '曲名の降順',
    key: 'title',
    direction: 'desc',
    expectedIds: ['zeta', 'gamma', 'beta', 'alpha'],
  },
  {
    label: '定数の昇順',
    key: 'const',
    direction: 'asc',
    expectedIds: ['zeta', 'beta', 'alpha', 'gamma'],
  },
  {
    label: '定数の降順',
    key: 'const',
    direction: 'desc',
    expectedIds: ['gamma', 'alpha', 'beta', 'zeta'],
  },
  {
    label: '自分のスコアの昇順',
    key: 'selfScore',
    direction: 'asc',
    expectedIds: ['zeta', 'beta', 'gamma', 'alpha'],
  },
  {
    label: '自分のスコアの降順',
    key: 'selfScore',
    direction: 'desc',
    expectedIds: ['alpha', 'gamma', 'beta', 'zeta'],
  },
  {
    label: '相手のスコアの昇順',
    key: 'friendScore',
    direction: 'asc',
    expectedIds: ['beta', 'zeta', 'alpha', 'gamma'],
  },
  {
    label: '相手のスコアの降順',
    key: 'friendScore',
    direction: 'desc',
    expectedIds: ['gamma', 'zeta', 'alpha', 'beta'],
  },
  {
    label: 'スコア差の昇順',
    key: 'difference',
    direction: 'asc',
    expectedIds: ['zeta', 'gamma', 'beta', 'alpha'],
  },
  {
    label: 'スコア差の降順',
    key: 'difference',
    direction: 'desc',
    expectedIds: ['alpha', 'beta', 'gamma', 'zeta'],
  },
  {
    label: 'ソート解除',
    key: null,
    direction: null,
    expectedIds: ['zeta', 'alpha', 'beta', 'gamma'],
  },
] as const) {
  /** 列ごとの比較と方向、入力順の不変性を検証する。 */
  test(`${label}で並び替えても元のAPI順は変わらない`, () => {
    // Given: 各列の順位が異なり、相手未プレイと同点も含む比較行。
    const items = [
      item('zeta', 0, true, true),
      item('alpha', 300, true, true),
      item('beta', 200, true, false),
      item('gamma', 150, true, true),
    ]
    items[0].chart.const = 13
    items[1].chart.const = 15
    items[3].chart.const = 16
    items[2].self.score = 200
    items[3].self.score = 350
    items[3].friend.score = 200

    // When: 指定列と方向で並び替える。
    const result = sortFriendVsItems(items, key, direction)

    // Then: 指定順になり、同値はAPI順を保ち、入力は変わらない。
    assert.deepEqual(
      result.map((row) => row.song.id),
      expectedIds
    )
    assert.deepEqual(
      items.map((row) => row.song.id),
      ['zeta', 'alpha', 'beta', 'gamma']
    )
  })
}

test('楽曲名は表記ではなく読みで昇順・降順に並べ、読みがなければ曲名を使う', () => {
  // Given: 曲名の表記順と読み順が異なる通常譜面とWORLD'S END譜面。
  const items = [
    {
      ...item('love', 0, true, true),
      song: { id: 'love', title: '愛', artist: '', reading: 'ラブ' },
    },
    {
      ...item('sky', 0, true, true),
      song: { id: 'sky', title: '空', artist: '', reading: 'ソラ' },
    },
    {
      ...item('apple', 0, true, true),
      song: { id: 'apple', title: 'リンゴ', artist: '', reading: null },
    },
  ]
  const worldsendItems = items.map((row) => ({
    ...row,
    chart: { level_star: 4, attribute: '蔵' },
  }))

  // When & Then: 両方の譜面種別で読み順を使い、元の配列は変更しない。
  for (const rows of [items, worldsendItems]) {
    assert.deepEqual(
      sortFriendVsItems(rows, 'title', 'asc').map((row) => row.song.id),
      ['sky', 'love', 'apple']
    )
    assert.deepEqual(
      sortFriendVsItems(rows, 'title', 'desc').map((row) => row.song.id),
      ['apple', 'love', 'sky']
    )
    assert.deepEqual(
      rows.map((row) => row.song.id),
      ['love', 'sky', 'apple']
    )
  }
})

test('ソート列または方向の片方だけがない場合はAPI順を保つこと', () => {
  // Given: タイトル順やスコア差順に並べると順序が変わる比較行。
  const items = [item('alpha', 300, true, true), item('beta', 100, true, true)]

  // When: 列だけ・方向だけを指定して並び替える。
  const withoutDirection = sortFriendVsItems(items, 'title', null)
  const withoutKey = sortFriendVsItems(items, null, 'asc')

  // Then: どちらか片方だけでは並び替えず入力順を保つ。
  assert.deepEqual(
    withoutDirection.map((row) => row.song.id),
    ['alpha', 'beta']
  )
  assert.deepEqual(
    withoutKey.map((row) => row.song.id),
    ['alpha', 'beta']
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
