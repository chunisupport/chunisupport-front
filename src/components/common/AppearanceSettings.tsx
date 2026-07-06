import type { JSX } from 'solid-js'
import {
  accentPreference,
  themePreference,
  updateAccentPreference,
  updateThemePreference,
} from '../../stores/themePreferences'
import type { AccentPreference, ThemePreference } from '../../utils/themePreference'
import {
  ACCENT_OPTIONS,
  APPEARANCE_SETTINGS_COPY,
  THEME_OPTIONS,
} from './AppearanceSettings.constants'
import { AppSelect } from './AppSelect'

const APPEARANCE_SELECT_TRIGGER_CLASS = 'min-h-11 px-4 py-3 font-semibold'
const APPEARANCE_SELECT_LABEL_CLASS = 'font-semibold'

/**
 * 背景テーマの選択値を表示ラベルへ変換する。
 *
 * @param value - 表示対象の背景テーマ。
 * @returns 背景テーマの表示ラベル。
 */
const formatThemeOptionLabel = (value: ThemePreference): string =>
  THEME_OPTIONS.find((option) => option.value === value)?.label ?? value

/**
 * アクセントカラーの選択肢定義を取得する。
 *
 * @param value - 検索対象のアクセントカラー。
 * @returns 一致するアクセントカラー選択肢。存在しない場合は undefined。
 */
const findAccentOption = (value: AccentPreference) =>
  ACCENT_OPTIONS.find((candidate) => candidate.value === value)

/**
 * アクセントカラーの選択値をテキストラベルへ変換する。
 *
 * @param value - 表示対象のアクセントカラー。
 * @returns アクセントカラーの表示ラベル。
 */
const formatAccentOptionText = (value: AccentPreference): string =>
  findAccentOption(value)?.label ?? value

/**
 * アクセントカラーの選択値をラベルと色見本で表示する。
 *
 * @param value - 表示対象のアクセントカラー。
 * @returns 色見本を含むアクセントカラーラベル。
 */
const formatAccentOptionLabel = (value: AccentPreference): JSX.Element => {
  const option = findAccentOption(value)

  return (
    <span class="flex items-center gap-3">
      <span
        class={`h-5 w-5 shrink-0 rounded-full border border-border-strong ${option?.swatchClass ?? ''}`}
        aria-hidden="true"
      />
      {formatAccentOptionText(value)}
    </span>
  )
}

/**
 * 背景テーマとアクセントカラーを独立して選択するUIを表示する。
 * @returns 外観設定のJSX要素
 */
const AppearanceSettings = (): JSX.Element => {
  /**
   * Selectの選択値を背景テーマとして適用する。
   * @param value 選択された背景テーマ
   * @returns なし
   */
  const handleThemeChange = (value: string | null): void => {
    if (value !== null && THEME_OPTIONS.some((option) => option.value === value)) {
      updateThemePreference(value as ThemePreference)
    }
  }

  /**
   * Selectの選択値をアクセントカラーとして適用する。
   * @param value 選択されたアクセントカラー
   * @returns なし
   */
  const handleAccentChange = (value: string | null): void => {
    if (value !== null && ACCENT_OPTIONS.some((option) => option.value === value)) {
      updateAccentPreference(value as AccentPreference)
    }
  }

  return (
    <div class="grid gap-6">
      <AppSelect<ThemePreference>
        options={THEME_OPTIONS.map((option) => option.value)}
        optionTextValue={formatThemeOptionLabel}
        value={themePreference()}
        onChange={handleThemeChange}
        label={APPEARANCE_SETTINGS_COPY.themeLabel}
        labelVariant="visible"
        formatLabel={formatThemeOptionLabel}
        triggerClass={APPEARANCE_SELECT_TRIGGER_CLASS}
        valueClass={APPEARANCE_SELECT_LABEL_CLASS}
      />

      <AppSelect<AccentPreference>
        options={ACCENT_OPTIONS.map((option) => option.value)}
        optionTextValue={formatAccentOptionText}
        value={accentPreference()}
        onChange={handleAccentChange}
        label={APPEARANCE_SETTINGS_COPY.accentLabel}
        labelVariant="visible"
        formatLabel={formatAccentOptionLabel}
        triggerClass={APPEARANCE_SELECT_TRIGGER_CLASS}
        valueClass={APPEARANCE_SELECT_LABEL_CLASS}
      />
    </div>
  )
}

export default AppearanceSettings
