import {
  CircleSlash,
  EyeOff,
  type LucideIcon,
  Minus,
  Sparkles,
  TriangleAlert,
  UserRound,
} from 'lucide-solid'
import type { UnifiedWeakChartCategory } from '../../utils/unifiedWeakChartInspector'

/** 統合分析の初期点差閾値。 */
export const UNIFIED_WEAK_CHART_THRESHOLD = 1000

/** 統合分析画面の表示文言。 */
export const UNIFIED_WEAK_CHART_COPY = {
  ratingBand: 'レート帯',
  threshold: '点差閾値',
  thresholdUnit: '点',
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
  personal: '外れ値',
  missing: '—',
  low: '低外れ値',
  high: '高外れ値',
  normal: '通常',
} as const

/** 判定ごとの表示名、アイコン、状態色。 */
export const UNIFIED_WEAK_CHART_CATEGORY_VIEW: Record<
  UnifiedWeakChartCategory,
  { label: string; icon: LucideIcon; class: string }
> = {
  confirmedWeakness: {
    label: '苦手',
    icon: TriangleAlert,
    class: 'bg-danger-bg text-danger',
  },
  hiddenWeakness: {
    label: '平均未満',
    icon: EyeOff,
    class: 'bg-warning-bg text-warning',
  },
  personalWeakness: {
    label: '苦手かも',
    icon: UserRound,
    class: 'bg-surface-muted text-link',
  },
  normal: {
    label: '平均並み',
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
  'minmax(12rem, 1fr) 3rem 3rem 5rem 5rem 4.75rem 4rem 7rem'

/** 数値入力の共通スタイル。 */
export const UNIFIED_WEAK_CHART_INPUT_CLASS =
  'h-10 w-full rounded border border-input-border bg-input-bg px-3 font-jost text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
