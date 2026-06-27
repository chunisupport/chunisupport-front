import {
  SCORE_MIN,
  WORLDSEND_LEVEL_STAR_MAX,
  WORLDSEND_LEVEL_STAR_MIN,
} from '../../../../constants/chart'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay'
import type { WorldsendFilterState } from '../types/filterTypes'

/**
 * WORLD'S END の★レベル表示を返す。
 *
 * @param levelStar - レベルの星数。未設定の場合はnull。
 * @returns フィルター表示用の★レベル文字列。
 */
export function formatWorldsendLevelStar(levelStar: number | null): string {
  return levelStar === null ? '不明' : `★${levelStar}`
}

/**
 * WORLD'S END の属性表示を返す。
 *
 * @param attribute - 属性。未設定の場合はnull。
 * @returns フィルター表示用の属性文字列。
 */
export function formatWorldsendAttribute(attribute: string | null): string {
  return attribute ?? '不明'
}

/**
 * WORLD'S END の JUSTICE数フィルターが有効か判定する。
 *
 * @param filter - 判定対象の WORLD'S END フィルター。
 * @returns JUSTICE数の下限または上限が指定されている場合はtrue。
 */
export function hasWorldsendJusticeCountFilter(filter: WorldsendFilterState): boolean {
  return filter.justiceCount.min !== null || filter.justiceCount.max !== null
}

/**
 * WORLD'S END フィルター条件を保存ダイアログ用の要約へ変換する。
 *
 * @param filter - 要約対象の WORLD'S END フィルター。
 * @returns 画面表示用のフィルター要約。
 */
export function formatWorldsendFilterSummary(filter: WorldsendFilterState): string {
  const parts: string[] = []
  if (filter.excludeNoPlay) parts.push('未プレイ譜面を除外')
  if (filter.attributes.length > 0) {
    parts.push(`属性: ${filter.attributes.map(formatWorldsendAttribute).join(',')}`)
  }
  if (
    filter.levelStarRange.min !== WORLDSEND_LEVEL_STAR_MIN ||
    filter.levelStarRange.max !== WORLDSEND_LEVEL_STAR_MAX
  ) {
    parts.push(
      `レベル: ${formatWorldsendLevelStar(filter.levelStarRange.min)}-${formatWorldsendLevelStar(
        filter.levelStarRange.max
      )}`
    )
  }
  if (filter.score.min !== SCORE_MIN || filter.score.max !== MAX_SCORE) {
    parts.push(`スコア: ${filter.score.min}-${filter.score.max}`)
  }
  if (filter.justiceCount.min !== null || filter.justiceCount.max !== null) {
    parts.push(`JUSTICE数: ${filter.justiceCount.min ?? ''}-${filter.justiceCount.max ?? ''}`)
  }
  if (filter.genres.length > 0) parts.push(`ジャンル: ${filter.genres.join(',')}`)
  if (filter.combo_lamp.length > 0) {
    parts.push(`コンボランプ: ${filter.combo_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  }
  if (filter.chain_lamp.length > 0) {
    parts.push(`FULL CHAIN: ${filter.chain_lamp.map(formatFullChainLampLabel).join(',')}`)
  }
  if (filter.hard_lamp.length > 0) {
    parts.push(`ハードランプ: ${filter.hard_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  }
  if (filter.versions.length > 0) parts.push(`バージョン: ${filter.versions.join(',')}`)
  return parts.join('\n')
}
