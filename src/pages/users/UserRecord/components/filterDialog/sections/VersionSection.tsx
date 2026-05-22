import { Checkbox } from '@kobalte/core/checkbox'
import { Check } from 'lucide-solid'
import type { Component } from 'solid-js'
import { For } from 'solid-js'

type VersionSectionProps = {
  versions: string[]
  selected: string[]
  onToggle: (version: string) => void
  onSelectAll: () => void
  onClear: () => void
}

const VersionSection: Component<VersionSectionProps> = (props) => (
  <div>
    <span class="block text-sm font-medium mb-1">バージョン</span>
    <div class="flex gap-2 mb-1">
      <button
        type="button"
        class="px-2 py-1 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover text-xs"
        onClick={props.onSelectAll}
      >
        すべて選択
      </button>
      <button
        type="button"
        class="px-2 py-1 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover text-xs"
        onClick={props.onClear}
      >
        すべて解除
      </button>
    </div>
    <div class="flex flex-col gap-2">
      <For each={props.versions}>
        {(ver, index) => {
          const id = `filter-version-${index()}`
          return (
            <Checkbox
              checked={props.selected.includes(ver)}
              onChange={() => props.onToggle(ver)}
              class="flex items-center gap-2"
            >
              <Checkbox.Input id={id} />
              <Checkbox.Control class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border-strong bg-surface-muted data-checked:border-action-primary data-checked:bg-action-primary data-checked:text-text-inverse">
                <Checkbox.Indicator>
                  <Check class="h-4 w-4" />
                </Checkbox.Indicator>
              </Checkbox.Control>
              <Checkbox.Label class="leading-5" for={id}>
                {ver}
              </Checkbox.Label>
            </Checkbox>
          )
        }}
      </For>
    </div>
  </div>
)

export default VersionSection
