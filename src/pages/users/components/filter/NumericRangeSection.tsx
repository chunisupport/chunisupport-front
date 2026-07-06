import type { Component } from 'solid-js'
import { TextRangeInput } from '../../../../components/common/RangeInput'
import { sanitizeRangeInput } from '../../../../utils/rangeInput'
import type { NumericRangeFilterConfig } from '../../constants/rangeFilters'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from './styles'

type NumericRangeSectionProps = {
  config: NumericRangeFilterConfig
  minValue: string
  maxValue: string
  onMinInput: (value: string) => void
  onMaxInput: (value: string) => void
  onMinCommit: (value: string) => void
  onMaxCommit: (value: string) => void
}

/**
 * 空欄を許す数値範囲フィルターの入力欄を表示する。
 *
 * @param props - 入力欄設定、現在値、入力中/確定時の変更ハンドラ。
 * @returns 数値範囲フィルターセクションの JSX 要素。
 */
const NumericRangeSection: Component<NumericRangeSectionProps> = (props) => (
  <TextRangeInput
    title={props.config.title}
    inputClass={FILTER_DIALOG_FIELD_INPUT_CLASS}
    start={{
      id: `filter-${props.config.idPrefix}-min`,
      label: props.config.minLabel,
      value: props.minValue,
      inputMode: props.config.inputMode,
      pattern: props.config.pattern,
      onInput: (value) => props.onMinInput(sanitizeRangeInput(value, props.config.allowedInput)),
      onCommit: props.onMinCommit,
    }}
    end={{
      id: `filter-${props.config.idPrefix}-max`,
      label: props.config.maxLabel,
      value: props.maxValue,
      inputMode: props.config.inputMode,
      pattern: props.config.pattern,
      onInput: (value) => props.onMaxInput(sanitizeRangeInput(value, props.config.allowedInput)),
      onCommit: props.onMaxCommit,
    }}
  />
)

export default NumericRangeSection
