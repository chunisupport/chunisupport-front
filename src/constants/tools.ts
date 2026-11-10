import type { AccountType } from '../types/api'
import {
  ALL_SONG_BEST_FRAME_PATH,
  BEST_SLOT_RANKING_PATH,
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  CHART_STATS_PATH,
  DASHBOARD_PATH,
  FRIEND_VS_PATH,
  LOCKED_SONG_DISCOVERY_PATH,
  ONLINE_WEAK_CHART_INSPECTOR_PATH,
  OVER_POWER_CALCULATOR_PATH,
  RANDOM_SONG_SELECTOR_PATH,
  RATING_THEORETICAL_CHECKER_PATH,
  UNI_FILL_MATRIX_PATH,
  WEAK_CHART_INSPECTOR_PATH,
} from './routes'

/**
 * ツールカードに表示するアイコン種別。
 */
export type ToolLinkIcon =
  | 'calculator'
  | 'chart'
  | 'globe'
  | 'distribution'
  | 'target'
  | 'random'
  | 'ranking'
  | 'percent'
  | 'gauge'
  | 'list'
  | 'discover'
  | 'friendVs'
  | 'matrix'

/** ツール一覧に表示する分類と表示順。 */
export const TOOL_CATEGORIES = [
  { id: 'calculator', title: '計算機' },
  { id: 'analysis', title: '分析・比較' },
  { id: 'data', title: 'データ閲覧' },
  { id: 'utility', title: '便利ツール' },
] as const

/** ツールが所属する分類。 */
export type ToolCategory = (typeof TOOL_CATEGORIES)[number]['id']

/**
 * 無効化されたツールカードに表示する状態ラベル。
 */
export const DISABLED_TOOL_BADGE_TEXT = 'coming soon'

/**
 * ADMIN 限定ツールカードの南京錠アイコンの説明。
 */
export const ADMIN_ONLY_TOOL_LOCK_LABEL = '管理者限定'

/**
 * ツールページに表示するリンク情報。
 *
 * @property title - ツールカードに表示する名前。
 * @property href - 有効時に遷移するツールページのパス。
 * @property category - ツール一覧で所属する分類。
 * @property icon - ツールカードに表示するアイコン種別。
 * @property description - ツールカードに表示する概要。
 * @property disabled - ツールカードを無効状態として表示し、リンク遷移を止めるかどうか。
 * @property adminOnly - ADMIN 以外のツール一覧から隠すかどうか。直接アクセスは妨げない。
 */
export type ToolLink = {
  title: string
  href: string
  icon: ToolLinkIcon
  category: ToolCategory
  description: string
  disabled?: boolean
  adminOnly?: boolean
}

/**
 * ツール一覧に表示するリンクか判定する。
 *
 * @param tool - 判定対象のツールリンク。
 * @param accountType - 現在ユーザーのアカウント種別。未ログイン時は undefined。
 * @returns ツール一覧へ表示する場合は true。
 */
export const isToolLinkListed = (tool: ToolLink, accountType: AccountType | undefined): boolean =>
  tool.adminOnly !== true || accountType === 'ADMIN'

/**
 * 固定ページ生成対象の公開ツールか判定する。
 *
 * @param tool - 判定対象のツールリンク。
 * @returns 公開中のツールとして扱う場合は true。
 */
export const isPublicToolLink = (tool: ToolLink): boolean =>
  tool.disabled !== true && isToolLinkListed(tool, undefined)

/**
 * パスに対応するツールリンク情報を取得する。
 *
 * TOOL_LINKS を単一の情報源としてツール一覧・ツール画面・静的メタで共有するための取得処理。
 *
 * @param href - 検索するツールページのパス。
 * @returns 対応するツールリンク情報。
 * @throws 対応するツールリンクが存在しない場合。
 */
export const getToolLink = (href: string): ToolLink => {
  const tool = TOOL_LINKS.find((candidate) => candidate.href === href)
  if (!tool) {
    throw new Error(`Unknown tool link: ${href}`)
  }
  return tool
}

/**
 * ツールページに表示するリンク一覧。
 */
export const TOOL_LINKS: ToolLink[] = [
  {
    title: 'レコード統計',
    href: CHART_STATS_PATH,
    category: 'data',
    icon: 'distribution',
    description: '全プレイヤーの記録から、譜面ごとのランク・コンボ・クリア状況を確認できます。',
  },
  {
    title: 'ダッシュボード',
    href: DASHBOARD_PATH,
    category: 'analysis',
    icon: 'chart',
    description: 'プレイ記録から達成状況と次に狙う譜面を確認できます。',
  },
  {
    title: 'フレンドVS',
    href: FRIEND_VS_PATH,
    category: 'analysis',
    icon: 'friendVs',
    description: 'フレンドとスコアで勝負。',
  },
  {
    title: '譜面定数計算機',
    href: CHART_CONSTANT_CALCULATOR_PATH,
    category: 'calculator',
    icon: 'calculator',
    description: 'OVER POWER変動から譜面定数を逆算します。',
  },
  {
    title: 'ボーダー計算機',
    href: BORDER_CALCULATOR_PATH,
    category: 'calculator',
    icon: 'target',
    description: '楽曲と譜面を選び、目標スコアまでの許容判定数を計算します。',
  },
  {
    title: 'OVER POWER計算機',
    href: OVER_POWER_CALCULATOR_PATH,
    category: 'calculator',
    icon: 'percent',
    description: 'OVER POWER値・達成率の換算、未プレイ譜面を補完した値の算出ができます。',
  },
  {
    title: '苦手譜面インスペクター',
    href: WEAK_CHART_INSPECTOR_PATH,
    category: 'analysis',
    icon: 'chart',
    description: '同レート帯の平均との差を自分の普段の差と比べ、見直す譜面の優先順位を確認します。',
  },
  {
    title: '苦手譜面インスペクター Online',
    href: ONLINE_WEAK_CHART_INSPECTOR_PATH,
    category: 'analysis',
    icon: 'globe',
    description: '自分のスコアを同じレート帯の平均スコアと比較します。',
  },
  {
    title: 'ランダム選曲',
    href: RANDOM_SONG_SELECTOR_PATH,
    category: 'utility',
    icon: 'random',
    description: '条件に合う通常譜面から指定曲数をランダムに選びます。',
  },
  {
    title: 'ベスト枠ランキング',
    href: BEST_SLOT_RANKING_PATH,
    category: 'data',
    icon: 'ranking',
    description: 'レート帯ごとのベスト枠採用率が高い譜面をランキングで確認できます。',
  },
  {
    title: '全曲ベスト枠',
    href: ALL_SONG_BEST_FRAME_PATH,
    category: 'data',
    icon: 'list',
    description: '全曲・全譜面から、単曲レート上位30曲・上位50曲を計算します。',
  },
  {
    title: 'ベスト枠・新曲枠理論値チェッカー',
    href: RATING_THEORETICAL_CHECKER_PATH,
    category: 'data',
    icon: 'gauge',
    description: '全譜面SSS+時の理論値レーティングを確認できます。',
  },
  {
    title: '未解禁曲ディスカバー',
    href: LOCKED_SONG_DISCOVERY_PATH,
    category: 'utility',
    icon: 'discover',
    description: '筐体上とChuniSupport上のOPの差から、未解禁曲の候補を絞り込むことができます。',
  },
  {
    title: 'ウニ埋めマトリックス',
    href: UNI_FILL_MATRIX_PATH,
    category: 'analysis',
    icon: 'matrix',
    description: '細かい組み合わせごとに、何譜面埋め終わっているかを確認できます。',
  },
]
