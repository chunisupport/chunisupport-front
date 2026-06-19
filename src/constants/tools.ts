import {
  BORDER_CALCULATOR_PATH,
  CHART_CONSTANT_CALCULATOR_PATH,
  LOCKED_SONGS_FINDER_PATH,
} from './routes'

/**
 * ツールカードに表示するアイコン種別。
 */
export type ToolLinkIcon = 'calculator' | 'target' | 'search'

/**
 * ツールページに表示するリンク情報。
 */
export type ToolLink = {
  title: string
  href: string
  icon: ToolLinkIcon
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
    title: '未解禁曲探索',
    href: LOCKED_SONGS_FINDER_PATH,
    icon: 'search',
  },
]
