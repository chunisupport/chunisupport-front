import type { Component } from 'solid-js'
import { For } from 'solid-js'
import { CheckboxField } from '../../../../../../components/common/CheckboxField'
import type { Difficulty } from '../../../../../../types/recordFilter'

type DifficultySectionProps = {
  difficulties: Difficulty[]
  selected: Difficulty[]
  currentOpTargetOnly: boolean
  onToggle: (difficulty: Difficulty) => void
  onCurrentOpTargetOnlyChange: (checked: boolean) => void
}

/** OP対象フィルターのチェックボックスID。 */
const CURRENT_OP_TARGET_ONLY_CHECKBOX_ID = 'filter-current-op-target-only'

/** OP計算対象譜面フィルターのラベル。 */
const CURRENT_OP_TARGET_ONLY_LABEL = 'OP計算対象の譜面のみ表示'

/**
 * 通常レコードの難易度条件と現在のOP対象条件を表示する。
 *
 * @param props - 難易度候補、選択状態、OP対象条件、各変更ハンドラ。
 * @returns 難易度フィルターセクションの JSX 要素。
 */
const DifficultySection: Component<DifficultySectionProps> = (props) => (
  <div>
    <span class="block text-sm font-medium mb-1">難易度</span>
    <div class="flex flex-col gap-2">
      <For each={props.difficulties}>
        {(diff, index) => {
          const id = `filter-difficulty-${index()}`
          return (
            <CheckboxField
              id={id}
              checked={props.selected.includes(diff)}
              onChange={() => props.onToggle(diff)}
              class="relative flex items-center gap-2"
              textVariant="large"
              label={diff}
            />
          )
        }}
      </For>
      <CheckboxField
        id={CURRENT_OP_TARGET_ONLY_CHECKBOX_ID}
        checked={props.currentOpTargetOnly}
        onChange={(checked) => props.onCurrentOpTargetOnlyChange(checked)}
        class="relative mt-1 flex items-center gap-2"
        textVariant="large"
        label={CURRENT_OP_TARGET_ONLY_LABEL}
      />
    </div>
  </div>
)

export default DifficultySection
