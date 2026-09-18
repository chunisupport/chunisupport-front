import { MAX_SCORE } from '../../../utils/scoreRank'
import type { SharedClearLamp, SharedComboLamp, SharedFullChain } from './recordStyleClasses'

/** FAILED以外のハードランプ短縮ラベル */
const HARD_LAMP_LABEL: Record<Exclude<NonNullable<SharedClearLamp>, 'FAILED'>, string> = {
  CLEAR: 'CLR',
  HARD: 'HRD',
  BRAVE: 'BRV',
  ABSOLUTE: 'ABS',
  CATASTROPHY: 'CTS',
}

/**
 * コンボランプバッジの表示ラベルを返す。
 *
 * @param lamp - APIのコンボランプ値。
 * @param score - AJC判定に使うスコア。
 * @returns コンボランプバッジの短縮ラベル。表示対象外の場合は空文字。
 */
export const getDefaultRecordLampLabel = (lamp: SharedComboLamp, score?: number): string => {
  if (lamp === 'FULL COMBO') return 'FC'
  if (lamp === 'ALL JUSTICE' && score === MAX_SCORE) return 'AJC'
  if (lamp === 'ALL JUSTICE') return 'AJ'
  return ''
}

/**
 * コンボランプの省略しない読み上げラベルを返す。
 *
 * @param lamp - APIのコンボランプ値。
 * @param score - AJC判定に使うスコア。
 * @returns コンボランプの完全な名称。未設定の場合は「なし」。
 */
export const getDefaultRecordLampAccessibleLabel = (
  lamp: SharedComboLamp,
  score?: number
): string => {
  if (lamp === 'ALL JUSTICE' && score === MAX_SCORE) return 'ALL JUSTICE CRITICAL'
  return lamp ?? 'なし'
}

/**
 * ハードランプバッジの表示ラベルを返す。
 *
 * @param lamp - APIのハードランプ値。
 * @returns ハードランプバッジの短縮ラベル。表示対象外の場合は空文字。
 */
export const getDefaultRecordHardLampLabel = (lamp: SharedClearLamp): string => {
  if (!lamp || lamp === 'FAILED') return ''
  return HARD_LAMP_LABEL[lamp]
}

/**
 * FULL CHAINバッジの表示ラベルを返す。
 *
 * @param fullChain - APIのFULL CHAINランプ値。
 * @returns FULL CHAINバッジの短縮ラベル。表示対象外の場合は空文字。
 */
export const getDefaultRecordFullChainLabel = (fullChain: SharedFullChain): string => {
  if (fullChain === 'FULL CHAIN GOLD' || fullChain === 'FULL CHAIN PLATINUM') return 'FCH'
  return ''
}

/**
 * FULL CHAINバッジの色分けに使うコンボランプ種別を返す。
 *
 * @param fullChain - APIのFULL CHAINランプ値。
 * @returns GOLDはFULL COMBO、PLATINUMはALL JUSTICE。表示対象外の場合は null。
 */
export const getDefaultRecordFullChainBadgeLamp = (
  fullChain: SharedFullChain
): NonNullable<SharedComboLamp> | null => {
  if (fullChain === 'FULL CHAIN GOLD') return 'FULL COMBO'
  if (fullChain === 'FULL CHAIN PLATINUM') return 'ALL JUSTICE'
  return null
}
