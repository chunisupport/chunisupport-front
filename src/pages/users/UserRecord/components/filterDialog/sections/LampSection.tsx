import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'

type LampSectionProps = {
  title: string
  idPrefix: string
  lamps: (string | null)[]
  selected: (string | null)[]
  onToggle: (lamp: string | null) => void
  onExcludeNoPlayChange: (value: boolean) => void
}

const LampSection: Component<LampSectionProps> = (props) => (
  <div>
    <span class="block text-sm font-medium mb-1">{props.title}</span>
    <div class="flex flex-col gap-2">
      <For each={props.lamps}>
        {(lamp, index) => {
          const id = `filter-${props.idPrefix}-${index()}`
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
              class="flex items-center gap-2"
            >
              <Checkbox.Input id={id} />
              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
                <Checkbox.Indicator>
                  <Check class="h-4 w-4" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="leading-5" for={id}>
                {lamp ?? 'なし'}
              </Checkbox.Label>
            </Checkbox>
          )
        }}
      </For>
    </div>
  </div>
)

export default LampSection
