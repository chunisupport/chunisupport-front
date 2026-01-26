import { TextField } from '@kobalte/core/text-field'
import { Funnel } from 'lucide-solid'
import type { Component } from 'solid-js'

type FilterToolbarProps = {
  title: string
  onTitleChange: (value: string) => void
  onOpenFilter: () => void
}

const FilterToolbar: Component<FilterToolbarProps> = (props) => (
  <div class="flex items-center mb-2 gap-2">
    <TextField class="flex-1">
      <TextField.Input
        class="w-full rounded border border-gray-300 px-2 py-1 focus:border-blue-500"
        placeholder="曲名で検索..."
        value={props.title}
        onInput={(event) => props.onTitleChange(event.currentTarget.value)}
      />
    </TextField>
    <button
      class="px-2 py-1 rounded border border-gray-500 flex items-center gap-2 hover:bg-gray-100"
      onClick={props.onOpenFilter}
      type="button"
    >
      <Funnel class="text-gray-700" size={16} /> フィルター
    </button>
  </div>
)

export default FilterToolbar
