import type { PlayerDataRecordChange } from '../../types/api'

/**
 * API由来のランプ値を比較用の大文字へ正規化する。
 *
 * @param value - 比較対象のランプ値。
 * @returns 大文字へ正規化したランプ値。値がない場合はnull。
 */
const normalizeLampForComparison = (value: string | null): string | null =>
  value?.toUpperCase() ?? null

/**
 * 更新差分がスコアを変えずランプだけを更新したものか判定する。
 *
 * @param change - 通常譜面、WORLD'S END、またはコースの更新差分。
 * @returns 既存レコードのスコアが不変で、いずれかのランプだけが変化した場合はtrue。
 */
export const isLampOnlyRegisterScoreChange = (change: PlayerDataRecordChange): boolean => {
  if (change.before === null || change.before.score !== change.after.score) return false

  if (change.record_type === 'course') {
    return (
      change.before.is_clear !== change.after.is_clear ||
      normalizeLampForComparison(change.before.combo_lamp) !==
        normalizeLampForComparison(change.after.combo_lamp)
    )
  }

  return (
    normalizeLampForComparison(change.before.clear_lamp) !==
      normalizeLampForComparison(change.after.clear_lamp) ||
    normalizeLampForComparison(change.before.combo_lamp) !==
      normalizeLampForComparison(change.after.combo_lamp) ||
    normalizeLampForComparison(change.before.full_chain) !==
      normalizeLampForComparison(change.after.full_chain)
  )
}
