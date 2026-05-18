import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import type { ScoreRank } from '../../../utils/scoreRank'

type SharedRecordSource = PlayerRecordDTO | WorldsendRecordDTO
export type SharedComboLamp = SharedRecordSource['combo_lamp']
export type SharedClearLamp = SharedRecordSource['clear_lamp']
export type FilterStatsRank =
  | Extract<ScoreRank, 'SSS+' | 'SSS' | 'SS+' | 'SS' | 'S+' | 'S'>
  | 'OTHERS'
  | '未プレイ'
export type FilterStatsComboLamp = NonNullable<SharedComboLamp> | 'なし' | '未プレイ'
export type FilterStatsClearLamp = NonNullable<SharedClearLamp> | '未プレイ'

/** レコードのスコアランク表示で使う文字色クラス。 */
export const SCORE_RANK_TEXT_CLASS: Record<ScoreRank, string> = {
  'SSS+': 'text-green-500',
  SSS: 'text-yellow-500',
  'SS+': 'text-orange-500',
  SS: 'text-orange-500',
  'S+': 'text-orange-500',
  S: 'text-orange-500',
  AAA: 'text-red-500',
  AA: 'text-red-500',
  A: 'text-red-500',
  BBB: 'text-sky-500',
  BB: 'text-sky-500',
  B: 'text-sky-500',
  C: 'text-amber-700',
  D: 'text-gray-500',
}

/** レコードのスコアランク文字色に合わせたフィルター統計グラフ用背景色クラス。 */
export const SCORE_RANK_BAR_CLASS: Record<FilterStatsRank, string> = {
  'SSS+': 'bg-green-500',
  SSS: 'bg-yellow-500',
  'SS+': 'bg-orange-500',
  SS: 'bg-orange-500',
  'S+': 'bg-orange-500',
  S: 'bg-orange-500',
  OTHERS: 'bg-gray-500',
  未プレイ: 'bg-gray-100',
}

/** レコードのコンボランプバッジで使う背景色クラス。 */
export const COMBO_LAMP_BADGE_BACKGROUND_CLASS: Record<NonNullable<SharedComboLamp>, string> = {
  'FULL COMBO': 'bg-orange-200',
  'ALL JUSTICE': 'bg-yellow-200',
}

/** レコードのコンボランプバッジで使う文字色クラス。 */
export const COMBO_LAMP_BADGE_TEXT_CLASS: Record<NonNullable<SharedComboLamp>, string> = {
  'FULL COMBO': 'text-orange-900',
  'ALL JUSTICE': 'text-yellow-900',
}

/** レコードのハードランプバッジで使う背景色クラス。 */
export const HARD_LAMP_BADGE_BACKGROUND_CLASS: Record<NonNullable<SharedClearLamp>, string> = {
  CLEAR: 'bg-gray-200',
  HARD: 'bg-red-200',
  BRAVE: 'bg-orange-200',
  ABSOLUTE: 'bg-yellow-200',
  CATASTROPHY: 'bg-green-200',
  FAILED: 'bg-gray-100',
}

/** レコードのハードランプバッジで使う文字色クラス。 */
export const HARD_LAMP_BADGE_TEXT_CLASS: Record<NonNullable<SharedClearLamp>, string> = {
  CLEAR: 'text-gray-900',
  HARD: 'text-red-900',
  BRAVE: 'text-orange-900',
  ABSOLUTE: 'text-yellow-900',
  CATASTROPHY: 'text-green-900',
  FAILED: 'text-gray-300',
}

/** レコードのコンボランプバッジ色に合わせたフィルター統計グラフ用背景色クラス。 */
export const COMBO_LAMP_BAR_CLASS: Record<FilterStatsComboLamp, string> = {
  'ALL JUSTICE': COMBO_LAMP_BADGE_BACKGROUND_CLASS['ALL JUSTICE'],
  'FULL COMBO': COMBO_LAMP_BADGE_BACKGROUND_CLASS['FULL COMBO'],
  なし: 'bg-gray-100',
  未プレイ: 'bg-gray-100',
}

/** レコードのハードランプバッジ色に合わせたフィルター統計グラフ用背景色クラス。 */
export const HARD_LAMP_BAR_CLASS: Record<FilterStatsClearLamp, string> = {
  CATASTROPHY: HARD_LAMP_BADGE_BACKGROUND_CLASS.CATASTROPHY,
  ABSOLUTE: HARD_LAMP_BADGE_BACKGROUND_CLASS.ABSOLUTE,
  BRAVE: HARD_LAMP_BADGE_BACKGROUND_CLASS.BRAVE,
  HARD: HARD_LAMP_BADGE_BACKGROUND_CLASS.HARD,
  CLEAR: HARD_LAMP_BADGE_BACKGROUND_CLASS.CLEAR,
  FAILED: HARD_LAMP_BADGE_BACKGROUND_CLASS.FAILED,
  未プレイ: 'bg-gray-100',
}
