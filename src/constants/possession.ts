import type { PossessionName } from '../types/api'

/** プレイヤー所持状況の正規名称。IDはマスタから解決する */
export const POSSESSION_NAMES = [
  'normal',
  'silver',
  'gold',
  'platina',
  'rainbow',
] as const satisfies readonly PossessionName[]

/** 未指定時に使う所持状況名。APIの省略時既定値と一致する */
export const DEFAULT_POSSESSION_NAME: PossessionName = 'normal'

const POSSESSION_NAME_SET: ReadonlySet<string> = new Set(POSSESSION_NAMES)

/**
 * 外部入力の所持状況名がマスタの正規値かを判定する。
 *
 * @param value - APIやマスタから受け取った所持状況名。
 * @returns 正規の所持状況名なら true。
 */
export const isPossessionName = (value: string): value is PossessionName =>
  POSSESSION_NAME_SET.has(value)
