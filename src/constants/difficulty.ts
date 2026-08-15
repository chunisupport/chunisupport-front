import type { PlayerDataDifficulty, PlayerDataStatisticsDifficulty } from '../types/api'

/** 通常譜面で扱う難易度の正規順序。 */
export const PLAYER_DATA_DIFFICULTIES = [
  'BASIC',
  'ADVANCED',
  'EXPERT',
  'MASTER',
  'ULTIMA',
] as const satisfies readonly PlayerDataDifficulty[]

/** 更新差分統計で扱う通常難易度とWORLD'S ENDの正規順序。 */
export const PLAYER_DATA_STATISTICS_DIFFICULTIES = [
  ...PLAYER_DATA_DIFFICULTIES,
  'WE',
] as const satisfies readonly PlayerDataStatisticsDifficulty[]

/** 難易度の外部入力を検証するための正規値Set。 */
const PLAYER_DATA_DIFFICULTY_SET: ReadonlySet<string> = new Set(PLAYER_DATA_DIFFICULTIES)

/**
 * 外部入力の難易度名を大文字のドメイン値へ正規化する。
 *
 * @param value - API・URL・マスターデータなどから受け取った難易度名。
 * @returns 正規の難易度。対応しない値の場合は null。
 */
export const normalizePlayerDataDifficulty = (value: string): PlayerDataDifficulty | null => {
  const normalized = value.trim().toUpperCase()
  return PLAYER_DATA_DIFFICULTY_SET.has(normalized) ? (normalized as PlayerDataDifficulty) : null
}

/** 通常譜面の難易度を正規順序へ変換するMap。 */
export const PLAYER_DATA_DIFFICULTY_ORDER: Readonly<Record<PlayerDataDifficulty, number>> = {
  BASIC: 0,
  ADVANCED: 1,
  EXPERT: 2,
  MASTER: 3,
  ULTIMA: 4,
}

/** コンパクト表示で使う難易度の1文字略称。 */
export const DIFFICULTY_SINGLE_LETTER_MAP: Readonly<Record<PlayerDataDifficulty, string>> = {
  BASIC: 'B',
  ADVANCED: 'A',
  EXPERT: 'E',
  MASTER: 'M',
  ULTIMA: 'U',
}

/** 楽曲一覧で使う難易度の3文字略称。 */
export const DIFFICULTY_SHORT_NAME_MAP: Readonly<Record<PlayerDataDifficulty, string>> = {
  BASIC: 'BAS',
  ADVANCED: 'ADV',
  EXPERT: 'EXP',
  MASTER: 'MAS',
  ULTIMA: 'ULT',
}

/** 難易度バッジへ適用するデザイントークンクラス。 */
export const DIFFICULTY_BADGE_CLASS_MAP: Readonly<Record<PlayerDataDifficulty, string>> = {
  BASIC: 'bg-difficulty-basic-bg text-difficulty-basic-text',
  ADVANCED: 'bg-difficulty-advanced-bg text-difficulty-advanced-text',
  EXPERT: 'bg-difficulty-expert-bg text-difficulty-expert-text',
  MASTER: 'bg-difficulty-master-bg text-difficulty-master-text',
  ULTIMA: 'bg-difficulty-ultima-bg text-difficulty-ultima-text',
}

/** レコードカード左端へ適用する難易度色クラス。 */
export const DIFFICULTY_CARD_BORDER_CLASS_MAP: Readonly<Record<PlayerDataDifficulty, string>> = {
  BASIC: 'before:bg-difficulty-basic-bg',
  ADVANCED: 'before:bg-difficulty-advanced-bg',
  EXPERT: 'before:bg-difficulty-expert-bg',
  MASTER: 'before:bg-difficulty-master-bg',
  ULTIMA:
    'before:[background:repeating-linear-gradient(-60deg,#ff0000_0,#ff0000_6px,#000000_6px,#000000_12px)]',
}
