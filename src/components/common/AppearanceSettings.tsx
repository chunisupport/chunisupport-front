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
 * アクセントカラーの選択値をラベルと色見本で表示する。
 *
 * @param value - 表示対象のアクセントカラー。
 * @returns 色見本を含むアクセントカラーラベル。
 */
const formatAccentOptionLabel = (value: AccentPreference): JSX.Element => {
  const option = ACCENT_OPTIONS.find((candidate) => candidate.value === value)

  return (
    <span class="flex items-center gap-3">
      <span
        class={`h-5 w-5 shrink-0 rounded-full border border-border-strong ${option?.swatchClass ?? ''}`}
        aria-hidden="true"
      />
      {option?.label ?? value}
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
        optionTextValue={(value) =>
          THEME_OPTIONS.find((option) => option.value === value)?.label ?? value
        }
        value={themePreference()}
        onChange={handleThemeChange}
        label={APPEARANCE_SETTINGS_COPY.themeLabel}
        labelVariant="visible"
        formatLabel={(value) =>
          THEME_OPTIONS.find((option) => option.value === value)?.label ?? value
        }
        triggerClass={APPEARANCE_SELECT_TRIGGER_CLASS}
        valueClass={APPEARANCE_SELECT_LABEL_CLASS}
      />

      <AppSelect<AccentPreference>
        options={ACCENT_OPTIONS.map((option) => option.value)}
        optionTextValue={(value) =>
          ACCENT_OPTIONS.find((option) => option.value === value)?.label ?? value
        }
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
