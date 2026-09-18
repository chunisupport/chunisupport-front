import type { AccountType } from '../types/api'
import {
  ALL_SONG_BEST_FRAME_PATH,
  BEST_SLOT_RANKING_PATH,
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  CHART_STATS_PATH,
  DASHBOARD_PATH,
  LOCKED_SONG_DISCOVERY_PATH,
  ONLINE_WEAK_CHART_INSPECTOR_PATH,
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
  | 'globe'
  | 'distribution'
  | 'target'
  | 'random'
  | 'ranking'
  | 'gauge'
  | 'list'
  | 'discover'

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
 * @property icon - ツールカードに表示するアイコン種別。
 * @property description - ツールカードに表示する概要。
 * @property disabled - ツールカードを無効状態として表示し、リンク遷移を止めるかどうか。
 * @property adminOnly - ADMIN 以外のツール一覧から隠すかどうか。直接アクセスは妨げない。
 */
export type ToolLink = {
  title: string
  href: string
  icon: ToolLinkIcon
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
    icon: 'distribution',
    description: '全プレイヤーの記録から、譜面ごとのランク・コンボ・クリア状況を確認できます。',
  },
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
    title: '苦手譜面インスペクター Online',
    href: ONLINE_WEAK_CHART_INSPECTOR_PATH,
    icon: 'globe',
    description: '自分のスコアを同じレート帯の平均スコアと比較します。',
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
    title: '未解禁曲ディスカバー',
    href: LOCKED_SONG_DISCOVERY_PATH,
    icon: 'discover',
    description: '分類別の筐体OVER POWERを照合し、未解禁曲がある範囲を絞り込みます。',
    adminOnly: true,
  },
  {
    title: 'ベスト枠・新曲枠理論値チェッカー',
    href: RATING_THEORETICAL_CHECKER_PATH,
    icon: 'gauge',
    description: '全譜面SSS+時の理論値レーティングを確認できます。',
  },
]
