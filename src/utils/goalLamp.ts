import { localizedCopy, withLocalizedLabels } from '../i18n'
import type { PlayerRecordDTO } from '../types/api'

export type HardLampGoalValue = 'HRD' | 'BRV' | 'ABS' | 'CTS'
export type ComboLampGoalValue = 'FC' | 'AJ'
export type FullChainGoalValue = 'GOLD' | 'PLATINUM'

/** ハードランプ目標で選択できる値 */
export const HARD_LAMP_VALUES = ['HRD', 'BRV', 'ABS', 'CTS'] as const

/** コンボランプ目標で選択できる値 */
export const COMBO_LAMP_VALUES = ['FC', 'AJ'] as const

/** FULL CHAIN目標で選択できる値 */
export const FULL_CHAIN_VALUES = ['GOLD', 'PLATINUM'] as const

/** ランプ目標の選択肢の表示文言 */
const GOAL_LAMP_LABELS = localizedCopy('goalLamp')

/** ハードランプ目標の選択肢 */
export const HARD_LAMP_OPTIONS = withLocalizedLabels(
  [{ value: 'HRD' }, { value: 'BRV' }, { value: 'ABS' }, { value: 'CTS' }] as const,
  GOAL_LAMP_LABELS
)

/** コンボランプ目標の選択肢 */
export const COMBO_LAMP_OPTIONS = withLocalizedLabels(
  [{ value: 'FC' }, { value: 'AJ' }] as const,
  GOAL_LAMP_LABELS
)

/** FULL CHAIN目標の選択肢 */
export const FULL_CHAIN_OPTIONS = withLocalizedLabels(
  [{ value: 'GOLD' }, { value: 'PLATINUM' }] as const,
  GOAL_LAMP_LABELS
)

/** プレイヤーレコード上のハードランプ達成順 */
export const HARD_LAMP_ORDER: Partial<Record<NonNullable<PlayerRecordDTO['clear_lamp']>, number>> =
  {
    HARD: 1,
    BRAVE: 2,
    ABSOLUTE: 3,
    CATASTROPHY: 4,
  }

/** プレイヤーレコード上のコンボランプ達成順 */
export const COMBO_LAMP_ORDER: Partial<Record<NonNullable<PlayerRecordDTO['combo_lamp']>, number>> =
  {
    'FULL COMBO': 1,
    'ALL JUSTICE': 2,
  }

/** ハードランプ目標を未達成レコード用フィルターへ変換するための対応表 */
export const HARD_LAMP_UNACHIEVED_FILTERS: Record<
  HardLampGoalValue,
  PlayerRecordDTO['clear_lamp'][]
> = {
  HRD: ['CLEAR', 'FAILED', null],
  BRV: ['HARD', 'CLEAR', 'FAILED', null],
  ABS: ['BRAVE', 'HARD', 'CLEAR', 'FAILED', null],
  CTS: ['ABSOLUTE', 'BRAVE', 'HARD', 'CLEAR', 'FAILED', null],
}

/** コンボランプ目標を未達成レコード用フィルターへ変換するための対応表 */
export const COMBO_LAMP_UNACHIEVED_FILTERS: Record<
  ComboLampGoalValue,
  PlayerRecordDTO['combo_lamp'][]
> = {
  FC: [null],
  AJ: ['FULL COMBO', null],
}

/** FULL CHAIN目標を未達成レコード用フィルターへ変換するための対応表 */
export const FULL_CHAIN_UNACHIEVED_FILTERS: Record<
  FullChainGoalValue,
  PlayerRecordDTO['full_chain'][]
> = {
  GOLD: ['FULL CHAIN PLATINUM', null],
  PLATINUM: ['FULL CHAIN GOLD', null],
}

/**
 * ハードランプ目標値に対応するレコード上のランプ名を取得する。
 *
 * @param value - ハードランプ目標値。
 * @returns プレイヤーレコードに保存されるハードランプ名。
 */
export const resolveHardLampRecordName = (
  value: HardLampGoalValue
): keyof typeof HARD_LAMP_ORDER =>
  value === 'HRD'
    ? 'HARD'
    : value === 'BRV'
      ? 'BRAVE'
      : value === 'ABS'
        ? 'ABSOLUTE'
        : 'CATASTROPHY'

/**
 * 文字列がハードランプ目標の値か判定する。
 *
 * @param value - 成果パラメータ内のランプ値。
 * @returns ハードランプ目標で利用できる値ならtrue。
 */
export const isHardLampGoalValue = (value: string): value is HardLampGoalValue =>
  HARD_LAMP_VALUES.includes(value as HardLampGoalValue)

/**
 * 文字列がコンボランプ目標の値か判定する。
 *
 * @param value - 成果パラメータ内のランプ値。
 * @returns コンボランプ目標で利用できる値ならtrue。
 */
export const isComboLampGoalValue = (value: string): value is ComboLampGoalValue =>
  COMBO_LAMP_VALUES.includes(value as ComboLampGoalValue)

/**
 * 文字列がFULL CHAIN目標の値か判定する。
 *
 * @param value - 成果パラメータ内のFULL CHAIN値。
 * @returns FULL CHAIN目標で利用できる値ならtrue。
 */
export const isFullChainGoalValue = (value: string): value is FullChainGoalValue =>
  FULL_CHAIN_VALUES.includes(value as FullChainGoalValue)

/**
 * FULL CHAIN目標値に対応するレコード上のランプ名を取得する。
 *
 * @param value - FULL CHAIN目標値。
 * @returns プレイヤーレコードに保存されるFULL CHAIN名。
 */
export const resolveFullChainRecordName = (
  value: FullChainGoalValue
): NonNullable<PlayerRecordDTO['full_chain']> =>
  value === 'GOLD' ? 'FULL CHAIN GOLD' : 'FULL CHAIN PLATINUM'
