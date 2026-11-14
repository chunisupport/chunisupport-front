import type { NavBarSide, NavRailSide } from '../../utils/navPlacementPreference'
import type { AccentPreference, ThemePreference } from '../../utils/themePreference'

/** 外観設定で選択できる背景テーマ */
export const THEME_OPTIONS = [
  { value: 'light', label: 'ホワイト' },
  { value: 'pastel-orange', label: 'パステルオレンジ' },
  { value: 'dark', label: 'ダークグリーン' },
  { value: 'dark-blue', label: 'ダークブルー' },
  { value: 'black', label: 'ブラック' },
] as const satisfies readonly { value: ThemePreference; label: string }[]

/** 外観設定で選択できるアクセントカラー */
export const ACCENT_OPTIONS = [
  { value: 'red', label: 'レッド', swatchClass: 'bg-red-500' },
  { value: 'orange', label: 'オレンジ', swatchClass: 'bg-orange-500' },
  { value: 'yellow', label: 'イエロー', swatchClass: 'bg-yellow-500' },
  { value: 'green', label: 'グリーン', swatchClass: 'bg-green-500' },
  { value: 'sky-blue', label: 'スカイブルー', swatchClass: 'bg-sky-500' },
  { value: 'blue', label: 'ブルー', swatchClass: 'bg-blue-500' },
  { value: 'violet', label: 'バイオレット', swatchClass: 'bg-violet-500' },
] as const satisfies readonly {
  value: AccentPreference
  label: string
  swatchClass: string
}[]

/** ナビゲーション配置設定に表示する文言 */
export const NAV_PLACEMENT_SETTINGS_COPY = {
  label: 'ナビゲーション',
  railAriaLabel: '幅の広い画面でのナビゲーション位置',
  barAriaLabel: '幅の狭い画面でのナビゲーション位置',
  barCompactModeToggle: 'コンパクトモード',
  barCompactModePrefix: '横バーの',
  sideLabels: { left: '左', right: '右', bottom: '下', top: '上' },
} as const satisfies {
  label: string
  railAriaLabel: string
  barAriaLabel: string
  barCompactModeToggle: string
  barCompactModePrefix: string
  sideLabels: Record<NavRailSide | NavBarSide, string>
}

/** 外観設定に表示する文言 */
export const APPEARANCE_SETTINGS_COPY = {
  sectionTitle: '外観',
  dialogDescription: '背景、アクセント、ナビゲーションの表示を選択します。',
  themeLabel: '背景',
  accentLabel: 'アクセント',
} as const
