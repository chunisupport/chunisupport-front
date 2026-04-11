import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'
import type { Difficulty } from '../../../types/types'

type DifficultySectionProps = {
  difficulties: Difficulty[]
  selected: Difficulty[]
  onToggle: (difficulty: Difficulty) => void
}

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
              class="flex items-center gap-2"
            >
              <Checkbox.Input id={id} />
              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-gray-50 data-checked:border-primary-600 data-checked:bg-primary-600 data-checked:text-white">
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
    </div>
  </div>
)

export default DifficultySection
