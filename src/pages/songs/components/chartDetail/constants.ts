import { formatMessage, localizedCopy } from '../../../../i18n'
/** 譜面詳細画面の表示文言 */
export const CHART_DETAIL_COPY = localizedCopy('songs.chartDetail')
/** スコア履歴の表示上限件数 */
export const SCORE_HISTORY_MAX_ENTRIES = 50
/** スコア履歴の件数上限の付記 */
export const SCORE_HISTORY_MAX_ENTRIES_LABEL = formatMessage(CHART_DETAIL_COPY.maxEntries, {
  count: SCORE_HISTORY_MAX_ENTRIES,
})
/** 3種類のランプを含む履歴表で各列の可読幅を維持する最小幅 */
export const SCORE_HISTORY_TABLE_MIN_WIDTH_CLASS = 'min-w-[32rem]'
