import type { PlayerRecordDTO } from './api'

/** プレイヤーレコードで扱う難易度。 */
export type Difficulty = PlayerRecordDTO['difficulty']

/** プレイヤーレコードで扱うコンボランプ。 */
export type ComboLamp = PlayerRecordDTO['combo_lamp']

/** プレイヤーレコードで扱うFULL CHAINランプ。 */
export type ChainLamp = PlayerRecordDTO['full_chain']

/** プレイヤーレコードで扱うハードランプ。 */
export type HardLamp = PlayerRecordDTO['clear_lamp']

/**
 * 下限と上限を持つ数値範囲フィルター。
 *
 * @template T - 範囲端に許可する数値型。未指定を許す場合は number | null。
 * @property min - 範囲の下限値。
 * @property max - 範囲の上限値。
 */
export type NumericRangeFilter<T extends number | null = number> = {
  min: T
  max: T
}
