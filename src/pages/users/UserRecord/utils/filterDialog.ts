import { MAX_SCORE } from '../../../../utils/scoreRank'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay'
import { CONST_MAX } from '../constants/constRange'
import type { FilterState } from '../types/types'

/**
 * 現在のフィルター条件を表示用の要約文字列に変換する。
 * @param filter - 要約対象のフィルター状態
 * @returns 画面に表示するフィルター条件の要約
 */
export function formatFilterSummary(filter: FilterState): string {
  const parts: string[] = []
  if (filter.excludeNoPlay) parts.push('未プレイ譜面を除外')
  if (filter.difficulties.length > 0) parts.push(`難易度: ${filter.difficulties.join(',')}`)
  if (filter.constMin !== 0.0 || filter.constMax !== CONST_MAX)
    parts.push(`定数: ${filter.constMin}-${filter.constMax}`)
  if (filter.scoreMin !== 0 || filter.scoreMax !== MAX_SCORE)
    parts.push(`スコア: ${filter.scoreMin}-${filter.scoreMax}`)
  if (filter.genres.length > 0) parts.push(`ジャンル: ${filter.genres.join(',')}`)
  if (filter.combo_lamp.length > 0)
    parts.push(`コンボランプ: ${filter.combo_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  if (filter.chain_lamp.length > 0)
    parts.push(`FULL CHAIN: ${filter.chain_lamp.map(formatFullChainLampLabel).join(',')}`)
  if (filter.hard_lamp.length > 0)
    parts.push(`ハードランプ: ${filter.hard_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  if (filter.versions.length > 0) parts.push(`バージョン: ${filter.versions.join(',')}`)
  return parts.join('\n')
}

export function parseNumberInput(value: string): number | undefined {
  if (value === '' || value === '.') return undefined
  if (/^\.\d+$/.test(value)) return parseFloat(`0${value}`)
  if (/^\d+\.$/.test(value)) return undefined // 末尾ドットは未確定
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

export function toggleArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}
