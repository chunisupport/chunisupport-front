type ComboLamp = 'FULL COMBO' | 'ALL JUSTICE' | null

const SCORE_UNIT = 1_000_000
const AJ_BONUS_UNIT = 10_000

/**
 * AJ時のJUSTICE数を算出する。
 * - AJではない: 空文字
 * - ノーツ数が無効(null/0以下): ハイフン
 */
export const calcJusticeCountForAj = (params: {
  comboLamp: ComboLamp
  score: number
  notes: number | null
}): number | '-' | '' => {
  const { comboLamp, score, notes } = params

  if (comboLamp !== 'ALL JUSTICE') return ''
  if (!notes || notes <= 0) return '-'

  const justiceCount = Math.round(
    (notes * (SCORE_UNIT + AJ_BONUS_UNIT) - notes * score) / SCORE_UNIT
  )
  if (justiceCount < 0) return 0
  if (justiceCount > notes) return notes
  return justiceCount
}
