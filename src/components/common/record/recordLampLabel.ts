import { MAX_SCORE } from '../../../utils/scoreRank'
import type { SharedComboLamp } from './recordStyleClasses'

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
