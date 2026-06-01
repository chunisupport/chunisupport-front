import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import { MAX_SCORE, type ScoreRank } from '../../../utils/scoreRank'

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
  'SSS+': 'text-score-rank-sssp-text',
  SSS: 'text-score-rank-sss-text',
  'SS+': 'text-score-rank-ss-text',
  SS: 'text-score-rank-ss-text',
  'S+': 'text-score-rank-ss-text',
  S: 'text-score-rank-ss-text',
  AAA: 'text-score-rank-a-text',
  AA: 'text-score-rank-a-text',
  A: 'text-score-rank-a-text',
  BBB: 'text-score-rank-b-text',
  BB: 'text-score-rank-b-text',
  B: 'text-score-rank-b-text',
  C: 'text-score-rank-c-text',
  D: 'text-score-rank-d-text',
}

/** レコードのスコアランク文字色に合わせたフィルター統計グラフ用背景色クラス。 */
export const SCORE_RANK_BAR_CLASS: Record<FilterStatsRank, string> = {
  'SSS+': 'bg-score-rank-sssp-bg',
  SSS: 'bg-score-rank-sss-bg',
  'SS+': 'bg-score-rank-ss-bg',
  SS: 'bg-score-rank-ss-bg',
  'S+': 'bg-score-rank-ss-bg',
  S: 'bg-score-rank-ss-bg',
  OTHERS: 'bg-score-rank-d-bg',
  未プレイ: 'bg-surface-hover',
}

/** レコードのコンボランプバッジで使う背景色クラス。 */
export const COMBO_LAMP_BADGE_BACKGROUND_CLASS: Record<NonNullable<SharedComboLamp>, string> = {
  'FULL COMBO': 'bg-lamp-full-combo-bg',
  'ALL JUSTICE': 'bg-lamp-all-justice-bg',
}

/** レコードのコンボランプバッジで使う文字色クラス。 */
export const COMBO_LAMP_BADGE_TEXT_CLASS: Record<NonNullable<SharedComboLamp>, string> = {
  'FULL COMBO': 'text-lamp-full-combo-text',
  'ALL JUSTICE': 'text-lamp-all-justice-text',
}

export const ALL_JUSTICE_CRITICAL_BADGE_CLASS =
  'bg-[linear-gradient(135deg,#ef4444_0%,#f97316_16%,#eab308_32%,#22c55e_48%,#06b6d4_64%,#3b82f6_80%,#a855f7_100%)] text-white shadow-sm [text-shadow:0_1px_2px_rgb(0_0_0_/_0.65)]'

/**
 * コンボランプとスコアから、レコード用コンボランプバッジの色クラスを返す。
 * @param lamp コンボランプ。FULL COMBO または ALL JUSTICE。
 * @param score レコードのスコア。AJC判定に利用する。
 * @returns バッジに適用する背景色・文字色・補助装飾のTailwindクラス。
 */
export const getComboLampBadgeClass = (
  lamp: NonNullable<SharedComboLamp>,
  score: number | undefined
): string => {
  if (lamp === 'ALL JUSTICE' && score === MAX_SCORE) return ALL_JUSTICE_CRITICAL_BADGE_CLASS

  return `${COMBO_LAMP_BADGE_BACKGROUND_CLASS[lamp]} ${COMBO_LAMP_BADGE_TEXT_CLASS[lamp]}`
}

/** レコードのハードランプバッジで使う背景色クラス。 */
export const HARD_LAMP_BADGE_BACKGROUND_CLASS: Record<NonNullable<SharedClearLamp>, string> = {
  CLEAR: 'bg-lamp-clear-bg',
  HARD: 'bg-lamp-hard-bg',
  BRAVE: 'bg-lamp-brave-bg',
  ABSOLUTE: 'bg-lamp-absolute-bg',
  CATASTROPHY: 'bg-lamp-catastrophy-bg',
  FAILED: 'bg-lamp-failed-bg',
}

/** レコードのハードランプバッジで使う文字色クラス。 */
export const HARD_LAMP_BADGE_TEXT_CLASS: Record<NonNullable<SharedClearLamp>, string> = {
  CLEAR: 'text-lamp-clear-text',
  HARD: 'text-lamp-hard-text',
  BRAVE: 'text-lamp-brave-text',
  ABSOLUTE: 'text-lamp-absolute-text',
  CATASTROPHY: 'text-lamp-catastrophy-text',
  FAILED: 'text-lamp-failed-text',
}

/** レコードのコンボランプバッジ色に合わせたフィルター統計グラフ用背景色クラス。 */
export const COMBO_LAMP_BAR_CLASS: Record<FilterStatsComboLamp, string> = {
  'ALL JUSTICE': COMBO_LAMP_BADGE_BACKGROUND_CLASS['ALL JUSTICE'],
  'FULL COMBO': COMBO_LAMP_BADGE_BACKGROUND_CLASS['FULL COMBO'],
  なし: 'bg-lamp-none-bg',
  未プレイ: 'bg-lamp-none-bg',
}

/** レコードのハードランプバッジ色に合わせたフィルター統計グラフ用背景色クラス。 */
export const HARD_LAMP_BAR_CLASS: Record<FilterStatsClearLamp, string> = {
  CATASTROPHY: HARD_LAMP_BADGE_BACKGROUND_CLASS.CATASTROPHY,
  ABSOLUTE: HARD_LAMP_BADGE_BACKGROUND_CLASS.ABSOLUTE,
  BRAVE: HARD_LAMP_BADGE_BACKGROUND_CLASS.BRAVE,
  HARD: HARD_LAMP_BADGE_BACKGROUND_CLASS.HARD,
  CLEAR: HARD_LAMP_BADGE_BACKGROUND_CLASS.CLEAR,
  FAILED: HARD_LAMP_BADGE_BACKGROUND_CLASS.FAILED,
  未プレイ: 'bg-lamp-none-bg',
}
