import type { FilterState } from '../types/recordFilter'
import { type ChartLevelLabel, toChartLevelLabel } from './chartLevel'

/**
 * 譜面定数が非表示のレベル指定に含まれるか判定する。
 *
 * @param chartConst - 判定する譜面定数。
 * @param levelSet - 遷移元が指定した表示レベル一覧。未指定なら全レベルが対象。
 * @returns 対象レベルの譜面ならtrue。
 */
export const matchesRecordFilterLevelSet = (
  chartConst: number,
  levelSet: readonly ChartLevelLabel[] | undefined
): boolean => !levelSet || levelSet.includes(toChartLevelLabel(chartConst))

/**
 * 非表示のレベル指定を取り除いたフィルターを返す。
 *
 * @param filter - 対象のフィルター。
 * @returns 保存や画面上の編集対象にできるフィルター。
 */
export const omitRecordFilterLevelSet = (filter: FilterState): FilterState => {
  const { levelSet, ...rest } = filter
  return levelSet === undefined ? filter : rest
}

/**
 * 通常の譜面定数・レベル条件が変更されたら、非表示のレベル指定を破棄する。
 *
 * @param previous - 変更前のフィルター。
 * @param next - 変更後のフィルター。
 * @returns 譜面定数・レベル条件が変わった場合はレベル指定を除いたフィルター。
 */
export const resetRecordFilterLevelSetOnConstChange = (
  previous: FilterState,
  next: FilterState
): FilterState =>
  next.const.min !== previous.const.min ||
  next.const.max !== previous.const.max ||
  next.constFilterMode !== previous.constFilterMode
    ? omitRecordFilterLevelSet(next)
    : next
