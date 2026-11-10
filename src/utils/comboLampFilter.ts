import type { ComboLamp, ComboLampFilter } from '../types/record'
import { MAX_SCORE } from './scoreRank'

/**
 * レコードのコンボランプをフィルター用の値へ変換する。
 *
 * @param comboLamp - API から取得したコンボランプ。
 * @param score - 対象レコードのスコア。
 * @returns 理論値の ALL JUSTICE を AJC として区別したフィルター値。
 */
export const getComboLampFilterValue = (comboLamp: ComboLamp, score: number): ComboLampFilter =>
  comboLamp === 'ALL JUSTICE' && score === MAX_SCORE ? 'ALL JUSTICE CRITICAL' : comboLamp

/**
 * AJC の選択肢がなかった保存済みコンボランプ条件を移行する。
 *
 * @param comboLamps - 旧形式のコンボランプ条件。
 * @returns ALL JUSTICE 選択時に AJC も含めたコンボランプ条件。
 */
export const migrateLegacyComboLampFilters = (
  comboLamps: readonly ComboLampFilter[]
): ComboLampFilter[] =>
  comboLamps.includes('ALL JUSTICE') && !comboLamps.includes('ALL JUSTICE CRITICAL')
    ? [...comboLamps, 'ALL JUSTICE CRITICAL']
    : [...comboLamps]
