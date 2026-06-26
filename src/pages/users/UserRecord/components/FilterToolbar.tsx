import { Button } from '@kobalte/core/button'
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

/**
 * レコード一覧の検索欄とフィルター操作ボタンを表示する。
 * @param props - 検索文字列、変更ハンドラー、各操作ダイアログを開くハンドラー。
 * @returns レコード一覧上部のフィルターツールバー。
 */
const FilterToolbar: Component<FilterToolbarProps> = (props) => (
  <div class="flex items-center mb-2 gap-2">
    <TextField class="min-w-0 flex-1" value={props.title} onChange={props.onTitleChange}>
      <div class="flex min-w-0 items-center gap-2 rounded border border-border-strong px-2 focus-within:border-focus-ring">
        <Search class="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
        <TextField.Input
          class="min-w-0 flex-1 py-2 font-sans text-sm outline-none"
          placeholder="曲名・アーティスト名で検索"
        />
      </div>
    </TextField>
    <Button
      class="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded border border-border-strong text-text-muted hover:bg-surface-hover disabled:cursor-not-allowed disabled:border-border-strong disabled:text-disabled-text disabled:hover:bg-transparent"
      onClick={props.onOpenFilter}
      type="button"
      aria-label="フィルター"
      title="フィルター"
      disabled={props.filterButtonDisabled}
    >
      <Funnel size={24} />
    </Button>
    <Button
      class="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded border border-border-strong text-text-muted hover:bg-surface-hover"
      onClick={props.onOpenColumnSettings}
      type="button"
      aria-label="列設定"
      title="列設定"
    >
      <Columns3 size={24} />
    </Button>
  </div>
)

export default FilterToolbar
