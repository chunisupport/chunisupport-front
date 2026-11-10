import {
  CircleSlash,
  type LucideIcon,
  Minus,
  Sparkles,
  TrendingDown,
  TriangleAlert,
} from 'lucide-solid'
import type {
  UnifiedWeakChartCategory,
  UnifiedWeakChartZone,
} from '../../utils/unifiedWeakChartInspector'

/** 統合分析画面の表示文言。 */
export const UNIFIED_WEAK_CHART_COPY = {
  ratingBand: 'レート帯',
  difficulty: '難易度',
  category: '判定',
  all: 'すべて',
  results: '分析結果',
  empty: '該当なし',
  noBands: 'レート帯データなし',
  title: '曲名',
  constant: '定数',
  score: 'スコア',
  aptitude: '得意度',
  missing: '—',
  chartTitle: '譜面定数別の得意度',
  chartLabel: '譜面定数ごとの得意度の散布図',
} as const

/** 判定ごとの表示名、アイコン、状態色、得意度バーの塗り色、散布図の点の色（CSSカスタムプロパティ名）。 */
export const UNIFIED_WEAK_CHART_CATEGORY_VIEW: Record<
  UnifiedWeakChartCategory,
  {
    label: string
    icon: LucideIcon
    class: string
    barClass: string
    pointColor: string
  }
> = {
  weakness: {
    label: '苦手',
    icon: TriangleAlert,
    class: 'bg-danger-bg text-danger',
    barClass: 'bg-danger',
    pointColor: '--cs-color-danger',
  },
  mildWeakness: {
    label: 'やや苦手',
    icon: TrendingDown,
    class: 'bg-warning-bg text-warning',
    barClass: 'bg-warning',
    pointColor: '--cs-color-warning',
  },
  normal: {
    label: 'ふつう',
    icon: Minus,
    class: 'bg-surface-muted text-text-muted',
    barClass: 'bg-text-muted',
    pointColor: '--cs-color-text-muted',
  },
  strength: {
    label: '得意',
    icon: Sparkles,
    class: 'bg-success-bg text-success',
    barClass: 'bg-success',
    pointColor: '--cs-color-success',
  },
  unavailable: {
    label: 'データなし',
    icon: CircleSlash,
    class: 'bg-surface-muted text-text-subtle',
    barClass: 'bg-text-subtle',
    pointColor: '--cs-color-text-subtle',
  },
}

/** 比較表で共有する列幅。 */
export const UNIFIED_WEAK_CHART_TABLE_GRID = 'minmax(12rem, 1fr) 3rem 3rem 5rem 7rem 7rem'

/** 散布図で判定の領域を塗る背景色（CSSカスタムプロパティ名）。 */
export const UNIFIED_WEAK_CHART_ZONE_COLOR: Record<UnifiedWeakChartZone['category'], string> = {
  weakness: '--cs-color-danger-bg',
  mildWeakness: '--cs-color-warning-bg',
  strength: '--cs-color-success-bg',
}

/** 散布図で同じ定数の点を横へ1段ずらす譜面定数の幅。 */
export const UNIFIED_WEAK_CHART_POINT_JITTER = 0.012

/** 散布図の横軸で、最小・最大の譜面定数の外側に空ける幅。 */
export const UNIFIED_WEAK_CHART_CONST_AXIS_PADDING = 0.1

/** 散布図の縦軸で、得意度の下限・上限の外側に空ける幅。下限・上限の点が軸に重ならないようにする。 */
export const UNIFIED_WEAK_CHART_APTITUDE_AXIS_PADDING = 3

/** 散布図の縦軸の目盛り間隔。 */
export const UNIFIED_WEAK_CHART_APTITUDE_TICK_STEP = 10

/** 散布図で、判定ごとの点を手前から描く順（Chart.js の order。小さいほど手前）。 */
export const UNIFIED_WEAK_CHART_POINT_ORDER: Record<UnifiedWeakChartCategory, number> = {
  weakness: 0,
  mildWeakness: 1,
  strength: 2,
  normal: 3,
  unavailable: 4,
}
