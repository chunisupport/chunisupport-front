import type { UnifiedWeakChartCategory } from '../../utils/unifiedWeakChartInspector'

/** 統合分析の初期点差閾値。 */
export const UNIFIED_WEAK_CHART_THRESHOLD = 1000

/** 統合分析画面の表示文言。 */
export const UNIFIED_WEAK_CHART_COPY = {
  ratingBand: '比較するレート帯',
  threshold: '帯平均からの不足点数',
  thresholdHint: 'この点数以上低い譜面を「帯でも低い」と判定します。0の場合は平均未満すべて。',
  difficulty: '集計する難易度',
  category: '分類',
  all: 'すべて',
  results: '見直し優先順',
  empty: 'この条件に一致するプレイ済み譜面がありません。',
  noBands: '比較できるレート帯がありません。',
  title: '曲名',
  constant: '定数',
  score: 'スコア',
  average: '帯平均',
  difference: '点差',
  personal: '個人内',
  missing: '—',
  low: '低外れ値',
  high: '高外れ値',
  normal: '通常',
} as const

/** 分類ごとの表示、判断根拠、状態色。 */
export const UNIFIED_WEAK_CHART_CATEGORY_VIEW: Record<
  UnifiedWeakChartCategory,
  { label: string; hint: string; class: string }
> = {
  confirmedWeakness: {
    label: '本当に苦手',
    hint: '個人内で低外れ値、帯平均より閾値以上低い',
    class: 'bg-danger-bg text-danger',
  },
  hiddenWeakness: {
    label: '隠れた弱点',
    hint: '個人内で低外れ値ではなく、帯平均より閾値以上低い',
    class: 'bg-warning-bg text-warning',
  },
  personalWeakness: {
    label: '自分だけ低い',
    hint: '個人内で低外れ値、帯との差は閾値未満または平均以上',
    class: 'bg-surface-muted text-link',
  },
  normal: {
    label: '標準',
    hint: '個人内で外れ値ではなく、帯との差は閾値未満または平均と同点',
    class: 'bg-surface-muted text-text-muted',
  },
  strength: {
    label: '得意寄り',
    hint: '帯でも低い条件に該当せず、個人内で高外れ値または帯平均より高いスコア',
    class: 'bg-success-bg text-success',
  },
  unavailable: {
    label: '比較データなし',
    hint: '選択したレート帯の平均スコアがない',
    class: 'bg-surface-muted text-text-subtle',
  },
}

/** 比較表で共有する列幅。 */
export const UNIFIED_WEAK_CHART_TABLE_GRID = 'minmax(12rem, 1fr) 6rem 3rem 6rem 6rem 6rem 6rem 8rem'

/** 数値入力の共通スタイル。 */
export const UNIFIED_WEAK_CHART_INPUT_CLASS =
  'h-10 w-full rounded border border-input-border bg-input-bg px-3 font-jost text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
