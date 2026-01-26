import type { FilterState } from '../types/types'

export function formatFilterSummary(filter: FilterState): string {
  const parts: string[] = []
  if (filter.excludeNoPlay) parts.push('未プレイ除外')
  if (filter.difficulties.length > 0) parts.push(`難易度: ${filter.difficulties.join(',')}`)
  if (filter.constMin !== 0.0 || filter.constMax !== 15.9)
    parts.push(`定数: ${filter.constMin}-${filter.constMax}`)
  if (filter.scoreMin !== 0 || filter.scoreMax !== 1010000)
    parts.push(`スコア: ${filter.scoreMin}-${filter.scoreMax}`)
  if (filter.genres.length > 0) parts.push(`ジャンル: ${filter.genres.join(',')}`)
  if (filter.lamps.length > 0)
    parts.push(`ランプ: ${filter.lamps.map((l) => l ?? 'なし').join(',')}`)
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
