import type { Component } from 'solid-js'
import { CHART_LEVEL_FILTER_OPTIONS } from '../../utils/chartLevel'
import { normalizeChartConstRangeInput } from '../../utils/rangeInput'
import { CheckboxField } from './CheckboxField'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from './filterStyles'
import {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
  SelectRangeInput,
  TextRangeInput,
} from './RangeInput'

/** レベル範囲セクションの見出し */
const CONST_LEVEL_RANGE_TITLE = 'レベル'

/** 譜面定数範囲セクションの見出し */
const CONST_VALUE_RANGE_TITLE = '譜面定数'
export type ChartConstRangeFieldProps = {
  /** 入力欄IDの接頭辞 */
  idPrefix?: string
  constFilterMode: 'level' | 'number'
  minValue: string
  maxValue: string
  constLevelMin: string
  constLevelMax: string
  onMinInput: (value: string) => void
  onMaxInput: (value: string) => void
  onMinCommit: (value: string) => void
  onMaxCommit: (value: string) => void
  onConstFilterModeChange: (mode: 'level' | 'number') => void
  onConstLevelChange: (type: 'min' | 'max', value: string) => void
}

/**
 * レベルまたは譜面定数の範囲条件を表示する。
 *
 * @param props - 範囲入力値、入力モード、選択値、各変更ハンドラ。
 * @returns 定数範囲フィルターセクションの JSX 要素。
 */
export const ChartConstRangeField: Component<ChartConstRangeFieldProps> = (props) => (
  <div>
    {props.constFilterMode === 'number' ? (
      <TextRangeInput
        title={CONST_VALUE_RANGE_TITLE}
        inputClass={FILTER_DIALOG_FIELD_INPUT_CLASS}
        start={{
          id: `${props.idPrefix ?? 'filter'}-const-min`,
          label: `${CONST_VALUE_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
          value: props.minValue,
          inputMode: 'decimal',
          pattern: '[0-9]*[.]?[0-9]*',
          normalizeInput: normalizeChartConstRangeInput,
          onInput: props.onMinInput,
          onCommit: props.onMinCommit,
        }}
        end={{
          id: `${props.idPrefix ?? 'filter'}-const-max`,
          label: `${CONST_VALUE_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
          value: props.maxValue,
          inputMode: 'decimal',
          pattern: '[0-9]*[.]?[0-9]*',
          normalizeInput: normalizeChartConstRangeInput,
          onInput: props.onMaxInput,
          onCommit: props.onMaxCommit,
        }}
      />
    ) : (
      <SelectRangeInput
        title={CONST_LEVEL_RANGE_TITLE}
        options={[...CHART_LEVEL_FILTER_OPTIONS]}
        placeholder="選択…"
        start={{
          value: props.constLevelMin,
          label: `${CONST_LEVEL_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
          onChange: (value) => props.onConstLevelChange('min', value),
        }}
        end={{
          value: props.constLevelMax,
          label: `${CONST_LEVEL_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
          onChange: (value) => props.onConstLevelChange('max', value),
        }}
      />
    )}
    <div class="mt-2">
      <CheckboxField
        id={`${props.idPrefix ?? 'filter'}-const-mode`}
        checked={props.constFilterMode === 'number'}
        onChange={(checked) => props.onConstFilterModeChange(checked ? 'number' : 'level')}
        class="flex items-center gap-2"
        textVariant="large"
        label="譜面定数で指定"
      />
    </div>
  </div>
)

export default ChartConstRangeField
