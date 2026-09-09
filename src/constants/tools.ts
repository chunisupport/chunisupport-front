import {
  ALL_SONG_BEST_FRAME_PATH,
  BEST_SLOT_RANKING_PATH,
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  DASHBOARD_PATH,
  RANDOM_SONG_SELECTOR_PATH,
  RATING_THEORETICAL_CHECKER_PATH,
  WEAK_CHART_INSPECTOR_PATH,
} from './routes'

/**
 * ツールカードに表示するアイコン種別。
 */
export type ToolLinkIcon =
  | 'calculator'
  | 'chart'
  | 'target'
  | 'random'
  | 'ranking'
  | 'gauge'
  | 'list'

/**
 * 無効化されたツールカードに表示する状態ラベル。
 */
export const DISABLED_TOOL_BADGE_TEXT = 'coming soon'

/**
 * ツールページに表示するリンク情報。
 *
 * @property title - ツールカードに表示する名前。
 * @property href - 有効時に遷移するツールページのパス。
 * @property icon - ツールカードに表示するアイコン種別。
 * @property description - ツールカードに表示する概要。
 * @property disabled - ツールカードを無効状態として表示し、リンク遷移を止めるかどうか。
 */
export type ToolLink = {
  title: string
  href: string
  icon: ToolLinkIcon
  description: string
  disabled?: boolean
}

/**
 * ツールページに表示するリンク一覧。
 */
export const TOOL_LINKS: ToolLink[] = [
  {
    title: 'ダッシュボード',
    href: DASHBOARD_PATH,
    icon: 'chart',
    description: 'プレイ記録から達成状況と次に狙う譜面を確認できます。',
  },
  {
    title: '譜面定数計算機',
    href: CHART_CONSTANT_CALCULATOR_PATH,
    icon: 'calculator',
    description: 'OVER POWER変動から譜面定数を逆算します。',
  },
  {
    title: 'ボーダー計算機',
    href: BORDER_CALCULATOR_PATH,
    icon: 'target',
    description: '楽曲と譜面を選び、目標スコアまでの許容判定数を計算します。',
  },
  {
    title: '苦手譜面インスペクター',
    href: WEAK_CHART_INSPECTOR_PATH,
    icon: 'chart',
    description: 'プレイ済み譜面を譜面定数ごとに比較し、得意・苦手譜面を推測します。',
  },
  {
    title: 'ランダム選曲',
    href: RANDOM_SONG_SELECTOR_PATH,
    icon: 'random',
    description: '条件に合う通常譜面から指定曲数をランダムに選びます。',
  },
  {
    title: 'ベスト枠ランキング',
    href: BEST_SLOT_RANKING_PATH,
    icon: 'ranking',
    description: 'レート帯ごとのベスト枠採用率が高い譜面をランキングで確認できます。',
  },
  {
    title: '全曲ベスト枠',
    href: ALL_SONG_BEST_FRAME_PATH,
    icon: 'list',
    description: '全曲・全譜面から、単曲レート上位30曲・上位50曲を計算します。',
  },
  {
    title: 'ベスト枠・新曲枠理論値チェッカー',
    href: RATING_THEORETICAL_CHECKER_PATH,
    icon: 'gauge',
    description: '全譜面SSS+時の理論値レーティングを確認できます。',
  },
]
