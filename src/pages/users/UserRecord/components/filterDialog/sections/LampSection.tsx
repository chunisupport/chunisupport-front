import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'

type LampSectionProps = {
  lamps: (string | null)[]
  selected: (string | null)[]
  onToggle: (lamp: string | null) => void
  onExcludeNoPlayChange: (value: boolean) => void
}

const LampSection: Component<LampSectionProps> = (props) => (
  <div>
    <span class="block text-sm font-medium mb-1">ランプ</span>
    <div class="flex flex-col gap-2">
      <For each={props.lamps}>
        {(lamp, index) => {
          const id = `filter-lamp-${index()}`
          return (
            <Checkbox
              checked={props.selected.includes(lamp)}
              onChange={() => {
                // 「なし」をOFFにした時、「未プレイ譜面を除外する」をONする
                if (lamp === null && props.selected.includes(lamp)) {
                  props.onExcludeNoPlayChange(true)
                }
                props.onToggle(lamp)
              }}
              class="flex"
            >
              <Checkbox.Input id={id} />
              <Checkbox.Control class="h-5 w-5 rounded-md border border-gray-300 bg-gray-50 data-checked:border-green-600 data-checked:bg-green-600 data-checked:text-white flex items-center justify-center mr-2">
                <Checkbox.Indicator>
                  <Check class="h-4 w-4" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label for={id}>{lamp ?? 'なし'}</Checkbox.Label>
            </Checkbox>
          )
        }}
      </For>
    </div>
  </div>
)

export default LampSection
