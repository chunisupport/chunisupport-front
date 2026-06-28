import {
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  LOCKED_SONGS_FINDER_PATH,
  OVER_POWER_CALCULATOR_PATH,
  WEAK_CHART_INSPECTOR_PATH,
} from './routes'

/**
 * ツールカードに表示するアイコン種別。
 */
export type ToolLinkIcon = 'calculator' | 'gauge' | 'chart' | 'target' | 'search'

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
 * @property disabled - ツールカードを無効状態として表示し、リンク遷移を止めるかどうか。
 */
export type ToolLink = {
  title: string
  href: string
  icon: ToolLinkIcon
  disabled?: boolean
}

/**
 * ツールページに表示するリンク一覧。
 */
export const TOOL_LINKS: ToolLink[] = [
  {
    title: '譜面定数計算機',
    href: CHART_CONSTANT_CALCULATOR_PATH,
    icon: 'calculator',
  },
  {
    title: 'ボーダー計算機',
    href: BORDER_CALCULATOR_PATH,
    icon: 'target',
  },
  {
    title: 'OVER POWER計算機',
    href: OVER_POWER_CALCULATOR_PATH,
    icon: 'gauge',
  },
  {
    title: '苦手譜面インスペクター',
    href: WEAK_CHART_INSPECTOR_PATH,
    icon: 'chart',
  },
  {
    title: '未解禁曲探索',
    href: LOCKED_SONGS_FINDER_PATH,
    icon: 'search',
    disabled: true,
  },
]
