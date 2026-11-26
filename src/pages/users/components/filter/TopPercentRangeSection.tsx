import { createEffect, createSignal } from 'solid-js'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from '../../../../components/common/filterStyles'
import { TextRangeInput } from '../../../../components/common/RangeInput'
import type { NumericRangeFilter } from '../../../../types/record'
import {
  normalizeHundredthsInput,
  parseCommittedNumberInput,
  toInputValue,
} from '../../../../utils/rangeInput'
import { TOP_PERCENT_RANGE_FILTER as CONFIG } from '../../constants/rangeFilters'

type TopPercentRange = NumericRangeFilter<number | null>

/**
 * 通常レコードと WORLD'S END で共通の上位%範囲入力欄を表示する。
 *
 * @param props - 編集中の範囲、実測範囲、確定値の通知先。
 * @returns 上位%の下限と上限を入力する欄。
 */
export default function TopPercentRangeSection(props: {
  range: TopPercentRange
  observedRange?: NumericRangeFilter
  onChange: (range: TopPercentRange) => void
}) {
  const [minInput, setMinInput] = createSignal(toInputValue(props.range.min))
  const [maxInput, setMaxInput] = createSignal(toInputValue(props.range.max))

  createEffect(() => {
    const range = props.range
    setMinInput(toInputValue(range.min))
    setMaxInput(toInputValue(range.max))
  })

  /**
   * 確定した範囲端をダイアログのフィルターへ反映する。
   *
   * @param endpoint - 更新する範囲端。
   * @param input - 正規化済みの入力文字列。
   * @returns なし。
   */
  const commit = (endpoint: keyof TopPercentRange, input: string) => {
    const value = parseCommittedNumberInput(input)
    props.onChange({
      ...props.range,
      [endpoint]: value !== undefined && Number.isFinite(value) ? value : null,
    })
  }

  /**
   * 上位%の入力を小数第2位までに制限し、上限へ収める。
   *
   * @param value - 入力欄の文字列。
   * @returns 正規化後の文字列。受け付けない入力は null。
   */
  const normalizeInput = (value: string) => normalizeHundredthsInput(value, CONFIG.max)

  return (
    <TextRangeInput
      title={CONFIG.title}
      inputClass={FILTER_DIALOG_FIELD_INPUT_CLASS}
      start={{
        id: `filter-${CONFIG.idPrefix}-min`,
        label: CONFIG.minLabel,
        value: minInput(),
        placeholder: props.observedRange?.min.toFixed(CONFIG.decimalPlaces),
        inputMode: CONFIG.inputMode,
        pattern: CONFIG.pattern,
        normalizeInput,
        onChange: setMinInput,
        onCommit: (value) => commit('min', value),
      }}
      end={{
        id: `filter-${CONFIG.idPrefix}-max`,
        label: CONFIG.maxLabel,
        value: maxInput(),
        placeholder: props.observedRange?.max.toFixed(CONFIG.decimalPlaces),
        inputMode: CONFIG.inputMode,
        pattern: CONFIG.pattern,
        normalizeInput,
        onChange: setMaxInput,
        onCommit: (value) => commit('max', value),
      }}
    />
  )
}
