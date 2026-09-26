import type { Component } from 'solid-js'
import { localizedCopy, t } from '../../i18n'
import { CHART_LEVEL_FILTER_OPTIONS } from '../../utils/chartLevel'
import { normalizeChartConstRangeInput } from '../../utils/rangeInput'
import { CheckboxField } from './CheckboxField'
import { FILTER_DIALOG_FIELD_INPUT_CLASS } from './filterStyles'
import { RANGE_INPUT_COPY, SelectRangeInput, TextRangeInput } from './RangeInput'

/** 譜面定数範囲フィールドの表示文言 */
const CHART_CONST_RANGE_COPY = localizedCopy('chartConstRange')

/** 譜面定数範囲セクションの見出し */
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
        title={CHART_CONST_RANGE_COPY.constant}
        inputClass={FILTER_DIALOG_FIELD_INPUT_CLASS}
        start={{
          id: `${props.idPrefix ?? 'filter'}-const-min`,
          label: `${CHART_CONST_RANGE_COPY.constant} ${RANGE_INPUT_COPY.startSuffix}`,
          value: props.minValue,
          inputMode: 'decimal',
          pattern: '[0-9]*[.]?[0-9]*',
          normalizeInput: normalizeChartConstRangeInput,
          onInput: props.onMinInput,
          onCommit: props.onMinCommit,
        }}
        end={{
          id: `${props.idPrefix ?? 'filter'}-const-max`,
          label: `${CHART_CONST_RANGE_COPY.constant} ${RANGE_INPUT_COPY.endSuffix}`,
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
        title={CHART_CONST_RANGE_COPY.level}
        options={[...CHART_LEVEL_FILTER_OPTIONS]}
        placeholder={t('common.selectPlaceholder')}
        start={{
          value: props.constLevelMin,
          label: `${CHART_CONST_RANGE_COPY.level} ${RANGE_INPUT_COPY.startSuffix}`,
          onChange: (value) => props.onConstLevelChange('min', value),
        }}
        end={{
          value: props.constLevelMax,
          label: `${CHART_CONST_RANGE_COPY.level} ${RANGE_INPUT_COPY.endSuffix}`,
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
        label={CHART_CONST_RANGE_COPY.useConstant}
      />
    </div>
  </div>
)

export default ChartConstRangeField
