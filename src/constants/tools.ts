import { localizedCopy } from '../i18n'
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
  | 'friendVs'

/**
 * 無効化されたツールカードに表示する状態ラベル。
 */
export const DISABLED_TOOL_BADGE_TEXT = 'coming soon'

/**
 * ADMIN 限定ツールカードの南京錠アイコンの説明。
 */
/** ツール一覧の表示文言 */
export const TOOLS_COPY = localizedCopy('tools')
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
 * 表示言語に追従するタイトルと概要を持つツールリンクを生成する。
 *
 * @param key - ツールの表示文言を参照する辞書キー。
 * @param link - タイトルと概要以外のリンク情報。
 * @returns ツールページに表示するリンク情報。
 */
const createToolLink = (
  key: keyof typeof TOOLS_COPY.links,
  link: Omit<ToolLink, 'title' | 'description'>
): ToolLink => ({
  ...link,
  get title() {
    return TOOLS_COPY.links[key].title
  },
  get description() {
    return TOOLS_COPY.links[key].description
  },
})

/**
 * ツールページに表示するリンク一覧。
 */
export const TOOL_LINKS: ToolLink[] = [
  createToolLink('chartStats', { href: CHART_STATS_PATH, icon: 'distribution' }),
  createToolLink('dashboard', { href: DASHBOARD_PATH, icon: 'chart' }),
  createToolLink('friendVs', { href: FRIEND_VS_PATH, icon: 'friendVs' }),
  createToolLink('chartConstantCalculator', {
    href: CHART_CONSTANT_CALCULATOR_PATH,
    icon: 'calculator',
  }),
  createToolLink('borderCalculator', { href: BORDER_CALCULATOR_PATH, icon: 'target' }),
  createToolLink('weakChartInspector', { href: WEAK_CHART_INSPECTOR_PATH, icon: 'chart' }),
  createToolLink('onlineWeakChartInspector', {
    href: ONLINE_WEAK_CHART_INSPECTOR_PATH,
    icon: 'globe',
  }),
  createToolLink('randomSongSelector', { href: RANDOM_SONG_SELECTOR_PATH, icon: 'random' }),
  createToolLink('bestSlotRanking', { href: BEST_SLOT_RANKING_PATH, icon: 'ranking' }),
  createToolLink('allSongBestFrame', { href: ALL_SONG_BEST_FRAME_PATH, icon: 'list' }),
  createToolLink('lockedSongDiscovery', {
    href: LOCKED_SONG_DISCOVERY_PATH,
    icon: 'discover',
    adminOnly: true,
  }),
  createToolLink('ratingTheoreticalChecker', {
    href: RATING_THEORETICAL_CHECKER_PATH,
    icon: 'gauge',
  }),
]
