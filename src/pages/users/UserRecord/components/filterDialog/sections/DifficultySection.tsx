import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'
import type { Difficulty } from '../../../types/types'

type DifficultySectionProps = {
  difficulties: Difficulty[]
  selected: Difficulty[]
  currentOpTargetOnly: boolean
  onToggle: (difficulty: Difficulty) => void
  onCurrentOpTargetOnlyChange: (checked: boolean) => void
}

/** OP対象フィルターのチェックボックスID。 */
const CURRENT_OP_TARGET_ONLY_CHECKBOX_ID = 'filter-current-op-target-only'

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
            <Checkbox
              checked={props.selected.includes(diff)}
              onChange={() => props.onToggle(diff)}
              class="relative flex items-center gap-2"
            >
              <Checkbox.Input id={id} style={{ left: '0', top: '0' }} />
              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
                <Checkbox.Indicator>
                  <Check class="h-4 w-4" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="leading-5" for={id}>
                {diff}
              </Checkbox.Label>
            </Checkbox>
          )
        }}
      </For>
      <Checkbox
        checked={props.currentOpTargetOnly}
        onChange={(checked) => props.onCurrentOpTargetOnlyChange(checked)}
        class="relative mt-1 flex items-center gap-2"
      >
        <Checkbox.Input id={CURRENT_OP_TARGET_ONLY_CHECKBOX_ID} style={{ left: '0', top: '0' }} />
        <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
          <Checkbox.Indicator>
            <Check class="h-4 w-4" />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.Label class="leading-5" for={CURRENT_OP_TARGET_ONLY_CHECKBOX_ID}>
          OP対象の楽曲のみを表示
        </Checkbox.Label>
      </Checkbox>
    </div>
  </div>
)

export default DifficultySection
