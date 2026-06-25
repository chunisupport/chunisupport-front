import { MAX_SCORE } from '../../../utils/scoreRank'
import { CONST_MAX, CONST_MIN, OVER_POWER_MAX } from '../UserRecord/constants/constRange'
import {
  CHAIN_LAMP_OPTIONS,
  COMBO_LAMP_OPTIONS,
  HARD_LAMP_OPTIONS,
} from '../UserRecord/types/filterDefaults'
import type {
  ChainLamp,
  ComboLamp,
  Difficulty,
  FilterState,
  HardLamp,
  NumericRangeFilter,
} from '../UserRecord/types/types'
import type { WorldsendFilterState } from '../WorldsendRecord/types/filterTypes'

/** API と同じ保存済みフィルター名の最大文字数。 */
export const RECORD_FILTER_NAME_MAX_LENGTH = 30

/** API と同じ保存済みフィルターペイロードの最大バイト数。 */
export const RECORD_FILTER_MAX_PAYLOAD_BYTES = 8 * 1024

const DIFFICULTY_OPTIONS: Difficulty[] = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA']
const WORLDSEND_LEVEL_STAR_MIN = 1
const WORLDSEND_LEVEL_STAR_MAX = 5

/**
 * 文字列を Unicode コードポイント単位で指定文字数へ丸める。
 *
 * @param value - 丸める文字列。
 * @param maxLength - 最大文字数。
 * @returns 最大文字数以内の文字列。
 */
const sliceRunes = (value: string, maxLength: number): string =>
  Array.from(value).slice(0, maxLength).join('')

/**
 * API と同じルールで保存済みフィルター名に制御文字が含まれるか判定する。
 *
 * @param value - 判定対象の名前。
 * @returns 制御文字が含まれる場合は true。
 */
export const hasRecordFilterNameControlCharacter = (value: string): boolean =>
  Array.from(value).some((char) => {
    const codePoint = char.codePointAt(0)
    return typeof codePoint === 'number' && (codePoint <= 0x1f || codePoint === 0x7f)
  })

/**
 * 保存済みフィルター名が API の入力制約を満たすか判定する。
 *
 * @param value - 判定対象の名前。
 * @returns 保存可能な名前の場合は true。
 */
export const isValidRecordFilterName = (value: string): boolean => {
  const name = value.trim()
  return (
    name.length > 0 &&
    Array.from(name).length <= RECORD_FILTER_NAME_MAX_LENGTH &&
    !hasRecordFilterNameControlCharacter(name)
  )
}

/**
 * 既存名と重複しない保存済みフィルター名を生成する。
 *
 * @param requestedName - ユーザーが入力した保存名。
 * @param existingNames - 既存の保存済みフィルター名。
 * @returns 重複時に末尾へ `(2)` 形式の番号を付けた保存名。
 */
export const buildUniqueRecordFilterName = (
  requestedName: string,
  existingNames: readonly string[]
): string => {
  const baseName = sliceRunes(requestedName.trim(), RECORD_FILTER_NAME_MAX_LENGTH)
  const usedNames = new Set(existingNames)
  if (!usedNames.has(baseName)) return baseName

  for (let index = 2; ; index += 1) {
    const suffix = `(${index})`
    const prefix = sliceRunes(baseName, RECORD_FILTER_NAME_MAX_LENGTH - Array.from(suffix).length)
    const candidate = `${prefix}${suffix}`
    if (!usedNames.has(candidate)) return candidate
  }
}

/**
 * API が検証する保存ペイロードのバイト数を計算する。
 *
 * @param schemaVersion - 保存するフィルタースキーマバージョン。
 * @param filter - 保存するフィルター状態。
 * @returns UTF-8 エンコード後のペイロードバイト数。
 */
export const getRecordFilterPayloadBytes = (schemaVersion: number, filter: unknown): number =>
  new TextEncoder().encode(JSON.stringify({ schema_version: schemaVersion, filter })).length

/**
 * 保存ペイロードが API のサイズ制限内か判定する。
 *
 * @param schemaVersion - 保存するフィルタースキーマバージョン。
 * @param filter - 保存するフィルター状態。
 * @returns サイズ制限内の場合は true。
 */
export const isRecordFilterPayloadWithinLimit = (schemaVersion: number, filter: unknown): boolean =>
  getRecordFilterPayloadBytes(schemaVersion, filter) <= RECORD_FILTER_MAX_PAYLOAD_BYTES

/**
 * null ではない通常オブジェクトかを判定する。
 *
 * @param value - 判定対象の値。
 * @returns 通常オブジェクトの場合は true。
 */
const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * 文字列配列かを判定する。
 *
 * @param value - 判定対象の値。
 * @returns すべての要素が文字列の配列の場合は true。
 */
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/**
 * 数値範囲オブジェクトかを判定する。
 *
 * @param value - 判定対象の値。
 * @param min - 許可する最小値。
 * @param max - 許可する最大値。
 * @param integer - 整数のみ許可する場合は true。
 * @returns min/max が許可範囲内の数値の場合は true。
 */
const isRequiredNumberRange = (
  value: unknown,
  min: number,
  max: number,
  integer = false
): value is NumericRangeFilter => {
  if (!isObjectRecord(value)) return false
  const minValue = value.min
  const maxValue = value.max
  const isValidNumber = (item: unknown) =>
    typeof item === 'number' &&
    Number.isFinite(item) &&
    item >= min &&
    item <= max &&
    (!integer || Number.isInteger(item))
  return isValidNumber(minValue) && isValidNumber(maxValue)
}

/**
 * null を許す数値範囲オブジェクトかを判定する。
 *
 * @param value - 判定対象の値。
 * @param min - 許可する最小値。
 * @param max - 許可する最大値。
 * @param integer - 整数のみ許可する場合は true。
 * @returns min/max が null または許可範囲内の数値の場合は true。
 */
const isOptionalNumberRange = (
  value: unknown,
  min: number,
  max: number,
  integer = false
): value is NumericRangeFilter<number | null> => {
  if (!isObjectRecord(value)) return false
  const isValidValue = (item: unknown) =>
    item === null ||
    (typeof item === 'number' &&
      Number.isFinite(item) &&
      item >= min &&
      item <= max &&
      (!integer || Number.isInteger(item)))
  return isValidValue(value.min) && isValidValue(value.max)
}

/**
 * 配列のすべての要素が許可値に含まれるか判定する。
 *
 * @param value - 判定対象の配列。
 * @param options - 許可値。
 * @returns 許可値だけで構成される配列の場合は true。
 */
const isArrayOfOptions = <T>(value: unknown, options: readonly T[]): value is T[] =>
  Array.isArray(value) && value.every((item) => options.includes(item as T))

/**
 * 保存済み通常レコードフィルターが現行スキーマとして読み込めるか判定する。
 *
 * @param value - API から受け取った filter 値。
 * @returns 現行の通常レコードフィルターとして安全に扱える場合は true。
 */
export const isValidSavedStandardFilter = (value: unknown): value is FilterState => {
  if (!isObjectRecord(value)) return false
  return (
    typeof value.title === 'string' &&
    isArrayOfOptions(value.difficulties, DIFFICULTY_OPTIONS) &&
    (value.currentOpTargetOnly === undefined || typeof value.currentOpTargetOnly === 'boolean') &&
    isStringArray(value.genres) &&
    isStringArray(value.versions) &&
    isRequiredNumberRange(value.const, CONST_MIN, CONST_MAX) &&
    (value.constFilterMode === 'level' || value.constFilterMode === 'number') &&
    isRequiredNumberRange(value.score, 0, MAX_SCORE, true) &&
    (value.scoreFilterMode === 'rank' || value.scoreFilterMode === 'number') &&
    isOptionalNumberRange(value.justiceCount, 0, Number.MAX_SAFE_INTEGER, true) &&
    isOptionalNumberRange(value.overPower, 0, OVER_POWER_MAX) &&
    isArrayOfOptions<ComboLamp>(value.combo_lamp, COMBO_LAMP_OPTIONS) &&
    isArrayOfOptions<ChainLamp>(value.chain_lamp, CHAIN_LAMP_OPTIONS) &&
    isArrayOfOptions<HardLamp>(value.hard_lamp, HARD_LAMP_OPTIONS) &&
    typeof value.excludeNoPlay === 'boolean'
  )
}

/**
 * 保存済み WORLD'S END フィルターが現行スキーマとして読み込めるか判定する。
 *
 * @param value - API から受け取った filter 値。
 * @returns 現行の WORLD'S END フィルターとして安全に扱える場合は true。
 */
export const isValidSavedWorldsendFilter = (value: unknown): value is WorldsendFilterState => {
  if (!isObjectRecord(value)) return false
  return (
    typeof value.title === 'string' &&
    (isStringArray(value.attributes) ||
      (Array.isArray(value.attributes) &&
        value.attributes.every((item) => typeof item === 'string' || item === null))) &&
    isRequiredNumberRange(
      value.levelStarRange,
      WORLDSEND_LEVEL_STAR_MIN,
      WORLDSEND_LEVEL_STAR_MAX,
      true
    ) &&
    isStringArray(value.genres) &&
    isStringArray(value.versions) &&
    isRequiredNumberRange(value.score, 0, MAX_SCORE, true) &&
    (value.scoreFilterMode === 'rank' || value.scoreFilterMode === 'number') &&
    isOptionalNumberRange(value.justiceCount, 0, Number.MAX_SAFE_INTEGER, true) &&
    isArrayOfOptions<ComboLamp>(value.combo_lamp, COMBO_LAMP_OPTIONS) &&
    isArrayOfOptions<ChainLamp>(value.chain_lamp, CHAIN_LAMP_OPTIONS) &&
    isArrayOfOptions<HardLamp>(value.hard_lamp, HARD_LAMP_OPTIONS) &&
    typeof value.excludeNoPlay === 'boolean'
  )
}
