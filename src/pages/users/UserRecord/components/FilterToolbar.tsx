import { TextField } from '@kobalte/core/text-field'
import { Columns3, Funnel, Search } from 'lucide-solid'
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
      <div class="flex items-center gap-2 rounded border border-border-strong px-2 focus-within:border-focus-ring">
        <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
        <TextField.Input
          class="min-w-0 flex-1 py-2 font-sans text-sm outline-none"
          placeholder="曲名・アーティスト名で検索"
          value={props.title}
          onInput={(event) => props.onTitleChange(event.currentTarget.value)}
        />
      </div>
    </TextField>
    <button
      class="flex h-[38px] w-[38px] items-center justify-center rounded border border-border-strong text-text-muted hover:bg-surface-hover disabled:cursor-not-allowed disabled:border-border-strong disabled:text-disabled-text disabled:hover:bg-transparent"
      onClick={props.onOpenFilter}
      type="button"
      aria-label="フィルター"
      title="フィルター"
      disabled={props.filterButtonDisabled}
    >
      <Funnel size={24} />
    </button>
    <button
      class="flex h-[38px] w-[38px] items-center justify-center rounded border border-border-strong text-text-muted hover:bg-surface-hover"
      onClick={props.onOpenColumnSettings}
      type="button"
      aria-label="列設定"
      title="列設定"
    >
      <Columns3 size={24} />
    </button>
  </div>
)

export default FilterToolbar
