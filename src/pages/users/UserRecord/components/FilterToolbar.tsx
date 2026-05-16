import { TextField } from '@kobalte/core/text-field'
import { Columns3, Funnel } from 'lucide-solid'
import type { Component } from 'solid-js'

type FilterToolbarProps = {
  title: string
  onTitleChange: (value: string) => void
  onOpenFilter: () => void
  onOpenColumnSettings: () => void
  filterButtonDisabled?: boolean
}

const FilterToolbar: Component<FilterToolbarProps> = (props) => (
  <div class="flex items-center mb-2 gap-2">
    <TextField class="flex-1">
      <TextField.Input
        class="w-full rounded border border-gray-300 px-3 py-2 font-sans text-sm focus:border-primary-500"
        placeholder="曲名で検索..."
        value={props.title}
        onInput={(event) => props.onTitleChange(event.currentTarget.value)}
      />
    </TextField>
    <button
      class="flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-500 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-transparent"
      onClick={props.onOpenFilter}
      type="button"
      aria-label="フィルター"
      title="フィルター"
      disabled={props.filterButtonDisabled}
    >
      <Funnel size={30} />
    </button>
    <button
      class="flex h-[38px] w-[38px] items-center justify-center rounded border border-gray-500 text-gray-700 hover:bg-gray-100"
      onClick={props.onOpenColumnSettings}
      type="button"
      aria-label="列設定"
      title="列設定"
    >
      <Columns3 size={30} />
    </button>
  </div>
)

export default FilterToolbar
