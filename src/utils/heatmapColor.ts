/** ヒートマップ背景色へ混ぜるアクセント色の最大割合 */
export const HEATMAP_MAX_MIX_PERCENT = 55

/**
 * 達成件数の割合に応じたヒートマップセルのテーマ連動背景色を生成する。
 *
 * @param count - 達成件数。
 * @param total - 集計対象の全譜面数。
 * @returns color-mixを使った背景色。
 */
export const getHeatmapBackground = (count: number, total: number): string => {
  const ratio = total > 0 ? count / total : 0
  const mixPercent = Math.round(ratio * HEATMAP_MAX_MIX_PERCENT)
  return `color-mix(in srgb, var(--cs-color-action-primary) ${mixPercent}%, var(--cs-color-surface))`
}
