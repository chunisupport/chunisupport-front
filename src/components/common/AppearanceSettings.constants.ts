import type { AccentPreference, ThemePreference } from '../../utils/themePreference'

/** 外観設定で選択できる背景テーマ。 */
export const THEME_OPTIONS = [
  { value: 'light', label: 'ホワイト' },
  { value: 'pastel-orange', label: 'パステルオレンジ' },
  { value: 'dark', label: 'ダークグリーン' },
  { value: 'black', label: 'ブラック' },
] as const satisfies readonly { value: ThemePreference; label: string }[]

/** 外観設定で選択できるアクセントカラー。 */
export const ACCENT_OPTIONS = [
  { value: 'green', label: 'グリーン', swatchClass: 'bg-green-500' },
  { value: 'orange', label: 'オレンジ', swatchClass: 'bg-orange-500' },
  { value: 'blue', label: 'ブルー', swatchClass: 'bg-blue-500' },
] as const satisfies readonly {
  value: AccentPreference
  label: string
  swatchClass: string
}[]

/** 外観設定に表示する文言。 */
export const APPEARANCE_SETTINGS_COPY = {
  sectionTitle: '外観',
  dialogDescription: '背景とアクセントを選択します。',
  themeLabel: '背景',
  accentLabel: 'アクセント',
} as const
