import { TextField } from '@kobalte/core/text-field'
import { Funnel } from 'lucide-solid'
import type { Component } from 'solid-js'

type FilterToolbarProps = {
  title: string
  onTitleChange: (value: string) => void
  onOpenFilter: () => void
  filterButtonDisabled?: boolean
}

const FilterToolbar: Component<FilterToolbarProps> = (props) => (
  <div class="flex items-center mb-2 gap-2">
    <TextField class="flex-1">
      <TextField.Input
        class="w-full rounded border border-gray-300 px-2 py-1 focus:border-primary-500"
        placeholder="曲名で検索..."
        value={props.title}
        onInput={(event) => props.onTitleChange(event.currentTarget.value)}
      />
    </TextField>
    <button
      class="px-2 py-1 rounded border border-gray-500 text-gray-700 flex items-center gap-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
      onClick={props.onOpenFilter}
      type="button"
      disabled={props.filterButtonDisabled}
    >
      <Funnel size={16} /> フィルター
    </button>
  </div>
)

export default FilterToolbar
