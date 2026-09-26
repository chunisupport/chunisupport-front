import { localizedCopy } from '../../i18n'
import type { AppLocale } from '../../utils/localePreference'
import type { AccentPreference, ThemePreference } from '../../utils/themePreference'

/** 外観設定に表示する文言 */
export const APPEARANCE_SETTINGS_COPY = localizedCopy('appearance')

const THEME_LABELS = APPEARANCE_SETTINGS_COPY.themes
const ACCENT_LABELS = APPEARANCE_SETTINGS_COPY.accents

/** 外観設定で選択できる背景テーマ */
export const THEME_OPTIONS = [
  {
    value: 'light',
    get label() {
      return THEME_LABELS.light
    },
  },
  {
    value: 'pastel-orange',
    get label() {
      return THEME_LABELS.pastelOrange
    },
  },
  {
    value: 'dark',
    get label() {
      return THEME_LABELS.dark
    },
  },
  {
    value: 'dark-blue',
    get label() {
      return THEME_LABELS.darkBlue
    },
  },
  {
    value: 'black',
    get label() {
      return THEME_LABELS.black
    },
  },
] as const satisfies readonly { value: ThemePreference; label: string }[]

/** 外観設定で選択できるアクセントカラー */
export const ACCENT_OPTIONS = [
  {
    value: 'red',
    swatchClass: 'bg-red-500',
    get label() {
      return ACCENT_LABELS.red
    },
  },
  {
    value: 'orange',
    swatchClass: 'bg-orange-500',
    get label() {
      return ACCENT_LABELS.orange
    },
  },
  {
    value: 'yellow',
    swatchClass: 'bg-yellow-500',
    get label() {
      return ACCENT_LABELS.yellow
    },
  },
  {
    value: 'green',
    swatchClass: 'bg-green-500',
    get label() {
      return ACCENT_LABELS.green
    },
  },
  {
    value: 'blue',
    swatchClass: 'bg-blue-500',
    get label() {
      return ACCENT_LABELS.blue
    },
  },
  {
    value: 'violet',
    swatchClass: 'bg-violet-500',
    get label() {
      return ACCENT_LABELS.violet
    },
  },
] as const satisfies readonly {
  value: AccentPreference
  label: string
  swatchClass: string
}[]

/** 言語設定で選択できる表示言語。言語名は切り替え先の言語で表記する。 */
export const LOCALE_OPTIONS = [
  { value: 'ja', label: '日本語' },
  { value: 'en', label: 'English' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'ko', label: '한국어' },
] as const satisfies readonly { value: AppLocale; label: string }[]
