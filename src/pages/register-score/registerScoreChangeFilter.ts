import type { PlayerDataRecordChange } from '../../types/api'
import { normalizeRegisterScoreLamp } from './registerScoreDisplay'

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
      normalizeRegisterScoreLamp(change.before.combo_lamp) !==
        normalizeRegisterScoreLamp(change.after.combo_lamp)
    )
  }

  return (
    normalizeRegisterScoreLamp(change.before.clear_lamp) !==
      normalizeRegisterScoreLamp(change.after.clear_lamp) ||
    normalizeRegisterScoreLamp(change.before.combo_lamp) !==
      normalizeRegisterScoreLamp(change.after.combo_lamp) ||
    normalizeRegisterScoreLamp(change.before.full_chain) !==
      normalizeRegisterScoreLamp(change.after.full_chain)
  )
}
