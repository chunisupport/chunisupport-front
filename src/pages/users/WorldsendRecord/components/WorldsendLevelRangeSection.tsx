import type { Component } from 'solid-js'
import {
  RANGE_END_LABEL_SUFFIX,
  RANGE_START_LABEL_SUFFIX,
  SelectRangeInput,
} from '../../../../components/common/RangeInput'
import { WORLDSEND_LEVEL_STAR_OPTIONS } from '../../../../constants/chart'
import { formatWorldsendLevelStar } from '../utils/filterDialog'

const WORLDSEND_LEVEL_RANGE_TITLE = 'レベル'

type WorldsendLevelRangeSectionProps = {
  minValue: number
  maxValue: number
  onChange: (type: 'min' | 'max', value: number) => void
}

/**
 * WORLD'S END の★レベル範囲をプルダウンで選択するセクションを表示する。
 *
 * @param props - 現在の範囲値と変更ハンドラー。
 * @returns ★レベル範囲選択セクションの JSX 要素。
 */
const WorldsendLevelRangeSection: Component<WorldsendLevelRangeSectionProps> = (props) => (
  <div>
    <SelectRangeInput<number>
      title={WORLDSEND_LEVEL_RANGE_TITLE}
      options={WORLDSEND_LEVEL_STAR_OPTIONS}
      placeholder="選択…"
      formatLabel={formatWorldsendLevelStar}
      start={{
        value: props.minValue,
        label: `${WORLDSEND_LEVEL_RANGE_TITLE} ${RANGE_START_LABEL_SUFFIX}`,
        onChange: (value) => props.onChange('min', value),
      }}
      end={{
        value: props.maxValue,
        label: `${WORLDSEND_LEVEL_RANGE_TITLE} ${RANGE_END_LABEL_SUFFIX}`,
        onChange: (value) => props.onChange('max', value),
      }}
    />
  </div>
)

export default WorldsendLevelRangeSection
