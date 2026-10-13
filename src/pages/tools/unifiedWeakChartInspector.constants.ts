import {
  CircleSlash,
  type LucideIcon,
  Minus,
  Sparkles,
  TrendingDown,
  TriangleAlert,
} from 'lucide-solid'
import type { UnifiedWeakChartCategory } from '../../utils/unifiedWeakChartInspector'

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
  average: '平均',
  difference: '点差',
  baseline: '普段の差',
  missing: '—',
} as const

/** 判定ごとの表示名、アイコン、状態色。 */
export const UNIFIED_WEAK_CHART_CATEGORY_VIEW: Record<
  UnifiedWeakChartCategory,
  { label: string; icon: LucideIcon; class: string }
> = {
  weakness: {
    label: '苦手',
    icon: TriangleAlert,
    class: 'bg-danger-bg text-danger',
  },
  mildWeakness: {
    label: 'やや苦手',
    icon: TrendingDown,
    class: 'bg-warning-bg text-warning',
  },
  normal: {
    label: 'ふつう',
    icon: Minus,
    class: 'bg-surface-muted text-text-muted',
  },
  strength: {
    label: '得意',
    icon: Sparkles,
    class: 'bg-success-bg text-success',
  },
  unavailable: {
    label: 'データなし',
    icon: CircleSlash,
    class: 'bg-surface-muted text-text-subtle',
  },
}

/** 比較表で共有する列幅。 */
export const UNIFIED_WEAK_CHART_TABLE_GRID =
  'minmax(12rem, 1fr) 3rem 3rem 5rem 5rem 4.75rem 4.75rem 7rem'
