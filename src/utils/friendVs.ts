import type { FriendScoreComparisonItemDTO, FriendScoreComparisonResult } from '../types/api'
import type { SortDirection } from './sortingQuery'

/** 比較表で使用できる表示条件。 */
export type FriendVsResultFilter = 'ALL' | FriendScoreComparisonResult | 'BOTH_PLAYED'

/** 比較表で並び替えられる列。 */
export type FriendVsSortKey = 'title' | 'const' | 'selfScore' | 'friendScore' | 'difference'

/**
 * 双方が挑戦した譜面だけの勝敗を集計する。
 *
 * @param items - APIから受け取った比較行。
 * @returns 対戦譜面数と双方の勝ち数、同点数。
 */
export const summarizeFriendVsMatches = (items: readonly FriendScoreComparisonItemDTO[]) => {
  const matches = items.filter((item) => item.self.is_played && item.friend.is_played)
  return {
    total: matches.length,
    selfWins: matches.filter((item) => item.result === 'SELF_WIN').length,
    draws: matches.filter((item) => item.result === 'DRAW').length,
    friendWins: matches.filter((item) => item.result === 'FRIEND_WIN').length,
  }
}

/**
 * 勝敗とプレイ状態で比較行を絞り込む。
 *
 * @param items - APIから受け取った比較行。
 * @param filter - 表示条件。
 * @returns 条件に一致する比較行。
 */
export const filterFriendVsItems = (
  items: readonly FriendScoreComparisonItemDTO[],
  filter: FriendVsResultFilter
): FriendScoreComparisonItemDTO[] => {
  if (filter === 'ALL') return [...items]
  if (filter === 'BOTH_PLAYED')
    return items.filter((item) => item.self.is_played && item.friend.is_played)
  return items.filter((item) => item.result === filter)
}

/**
 * APIのマスタ順または選択した列の値で比較行を並べる。
 *
 * @param items - 表示対象の比較行。
 * @param sortKey - 選択された列。null はAPIの楽曲順。
 * @param direction - 並び替え方向。
 * @returns 並び替え済みの新しい配列。
 */
export const sortFriendVsItems = (
  items: readonly FriendScoreComparisonItemDTO[],
  sortKey: FriendVsSortKey | null,
  direction: SortDirection | null
): FriendScoreComparisonItemDTO[] => {
  if (!sortKey || !direction) return [...items]

  const multiplier = direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    if (sortKey === 'title') return multiplier * a.song.title.localeCompare(b.song.title, 'ja-JP')
    if (sortKey === 'const') return multiplier * (a.chart.const - b.chart.const)
    if (sortKey === 'selfScore') return multiplier * (a.self.score - b.self.score)
    if (sortKey === 'friendScore') return multiplier * (a.friend.score - b.friend.score)
    return multiplier * (a.score_difference - b.score_difference)
  })
}
