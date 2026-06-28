import type { PlayerRecordDTO } from '../../../types/api'

export type HardLampGoalValue = 'HRD' | 'BRV' | 'ABS' | 'CTS'
export type ComboLampGoalValue = 'FC' | 'AJ'

/** ハードランプ目標で選択できる値。 */
export const HARD_LAMP_VALUES = ['HRD', 'BRV', 'ABS', 'CTS'] as const

/** コンボランプ目標で選択できる値。 */
export const COMBO_LAMP_VALUES = ['FC', 'AJ'] as const

/** ハードランプ目標の選択肢。 */
export const HARD_LAMP_OPTIONS = [
  { value: 'HRD', label: 'HARD以上' },
  { value: 'BRV', label: 'BRAVE以上' },
  { value: 'ABS', label: 'ABSOLUTE以上' },
  { value: 'CTS', label: 'CATASTROPHY以上' },
] as const satisfies readonly { value: HardLampGoalValue; label: string }[]

/** コンボランプ目標の選択肢。 */
export const COMBO_LAMP_OPTIONS = [
  { value: 'FC', label: 'FULL COMBO以上' },
  { value: 'AJ', label: 'ALL JUSTICE' },
] as const satisfies readonly { value: ComboLampGoalValue; label: string }[]

/** プレイヤーレコード上のハードランプ達成順。 */
export const HARD_LAMP_ORDER: Partial<Record<NonNullable<PlayerRecordDTO['clear_lamp']>, number>> =
  {
    HARD: 1,
    BRAVE: 2,
    ABSOLUTE: 3,
    CATASTROPHY: 4,
  }

/** プレイヤーレコード上のコンボランプ達成順。 */
export const COMBO_LAMP_ORDER: Partial<Record<NonNullable<PlayerRecordDTO['combo_lamp']>, number>> =
  {
    'FULL COMBO': 1,
    'ALL JUSTICE': 2,
  }

/** ハードランプ目標を未達成レコード用フィルターへ変換するための対応表。 */
export const HARD_LAMP_UNACHIEVED_FILTERS: Record<
  HardLampGoalValue,
  PlayerRecordDTO['clear_lamp'][]
> = {
  HRD: ['CLEAR', 'FAILED', null],
  BRV: ['HARD', 'CLEAR', 'FAILED', null],
  ABS: ['BRAVE', 'HARD', 'CLEAR', 'FAILED', null],
  CTS: ['ABSOLUTE', 'BRAVE', 'HARD', 'CLEAR', 'FAILED', null],
}

/** コンボランプ目標を未達成レコード用フィルターへ変換するための対応表。 */
export const COMBO_LAMP_UNACHIEVED_FILTERS: Record<
  ComboLampGoalValue,
  PlayerRecordDTO['combo_lamp'][]
> = {
  FC: [null],
  AJ: ['FULL COMBO', null],
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
