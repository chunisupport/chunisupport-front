import { TextField } from '@kobalte/core/text-field'
import type { JSX } from 'solid-js'
import { normalizeScoreRangeInput } from '../../utils/rangeInput'

/** 整数スコア入力の表示と変更通知。 */
type ScoreFieldProps = {
  id: string
  label: string
  labelVariant?: 'visible' | 'srOnly'
  value: string
  inputClass: string
  onChange: (value: string) => void
}

/**
 * 既存のスコア正規化処理で0〜1,010,000の整数を入力する共通欄。
 *
 * @param props - 入力欄ID、ラベル、入力値、スタイル、変更通知先。
 * @returns 小数を受け付けず、有効なスコア範囲へ制限する入力欄。
 */
export const ScoreField = (props: ScoreFieldProps): JSX.Element => (
  <TextField
    id={props.id}
    value={props.value}
    class="min-w-0 flex-1"
    onChange={(value) => {
      const normalized = normalizeScoreRangeInput(value)
      if (normalized !== null) props.onChange(normalized)
    }}
  >
    <TextField.Label
      class={
        props.labelVariant === 'srOnly'
          ? 'sr-only'
          : 'mb-1 block text-sm font-medium text-text-muted'
      }
    >
      {props.label}
    </TextField.Label>
    <TextField.Input
      inputMode="numeric"
      class={props.inputClass}
      onFocus={(event) => event.currentTarget.select()}
    />
  </TextField>
)
