import { buildSongDetailPath, buildWorldsendSongDetailPath } from '../constants/routes'
import type {
  FriendComparisonDifficulty,
  FriendScoreComparisonItemDTO,
  FriendScoreComparisonResult,
  WorldsendFriendScoreComparisonItemDTO,
} from '../types/api'
import { getConstDisplay } from './constDisplay'
import type { SortDirection } from './sortingQuery'

/** 通常譜面またはWORLD'S END譜面の比較行。 */
export type FriendVsItem = FriendScoreComparisonItemDTO | WorldsendFriendScoreComparisonItemDTO

/**
 * 譜面の種類に合わせて比較行の詳細画面パスを返す。
 *
 * @param item - 比較対象の譜面。
 * @param difficulty - 選択中の難易度。
 * @returns 譜面に対応する楽曲詳細パス。
 */
export const getFriendVsSongPath = (
  item: FriendVsItem,
  difficulty: FriendComparisonDifficulty
): string =>
  difficulty === "WORLD'S END"
    ? buildWorldsendSongDetailPath(item.song.id)
    : buildSongDetailPath(item.song.id, difficulty)

/**
 * 通常譜面の定数またはWORLD'S ENDの星数と属性を表示用に整形する。
 *
 * @param item - 表示する比較行。
 * @returns 譜面レベルの文字列、補助マーカーとスタイル。
 */
export const getFriendVsChartDisplay = (item: FriendVsItem) => {
  if ('const' in item.chart) {
    return getConstDisplay(item.chart.const, item.chart.is_const_unknown)
  }
  return {
    valueText: `${item.chart.level_star === null ? '★-' : `★${item.chart.level_star}`}${item.chart.attribute ? ` ${item.chart.attribute}` : ''}`,
    markerText: null,
    className: 'text-text',
  }
}

/** 比較表で使用できる表示条件。 */
export type FriendVsResultFilter = 'ALL' | FriendScoreComparisonResult

/** 比較表で並び替えられる列。 */
export type FriendVsSortKey = 'title' | 'const' | 'selfScore' | 'friendScore' | 'difference'

/**
 * 双方が挑戦した譜面だけの勝敗を集計する。
 *
 * @param items - APIから受け取った比較行。
 * @returns 対戦譜面数と双方の勝ち数、同点数。
 */
export const summarizeFriendVsMatches = (items: readonly FriendVsItem[]) => {
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
 * @param filter - 勝敗の表示条件。勝敗を指定した場合は双方が挑戦した譜面だけを対象にする。
 * @param excludeUnplayed - どちらかが未プレイの譜面を除外するか。
 * @returns 条件に一致する比較行。
 */
export const filterFriendVsItems = (
  items: readonly FriendVsItem[],
  filter: FriendVsResultFilter,
  excludeUnplayed: boolean
): FriendVsItem[] => {
  if (filter === 'ALL' && !excludeUnplayed) return [...items]
  return items.filter(
    (item) =>
      (filter === 'ALL' || item.result === filter) && item.self.is_played && item.friend.is_played
  )
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
  items: readonly FriendVsItem[],
  sortKey: FriendVsSortKey | null,
  direction: SortDirection | null
): FriendVsItem[] => {
  if (!sortKey || !direction) return [...items]

  const multiplier = direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    if (sortKey === 'title') return multiplier * a.song.title.localeCompare(b.song.title, 'ja-JP')
    if (sortKey === 'const') {
      const aLevel = 'const' in a.chart ? a.chart.const : (a.chart.level_star ?? -1)
      const bLevel = 'const' in b.chart ? b.chart.const : (b.chart.level_star ?? -1)
      return multiplier * (aLevel - bLevel)
    }
    if (sortKey === 'selfScore') return multiplier * (a.self.score - b.self.score)
    if (sortKey === 'friendScore') return multiplier * (a.friend.score - b.friend.score)
    return multiplier * (a.score_difference - b.score_difference)
  })
}
