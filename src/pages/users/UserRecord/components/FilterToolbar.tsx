import { Button } from '@kobalte/core/button'
import { TextField } from '@kobalte/core/text-field'
import { Columns3, Funnel, Search } from 'lucide-solid'
import type { Component } from 'solid-js'

type FilterButtonTone = 'default' | 'active' | 'difficulty-only'

type FilterToolbarProps = {
  title: string
  onTitleChange: (value: string) => void
  onOpenFilter: () => void
  onOpenColumnSettings: () => void
  titleActive?: boolean
  filterActive?: boolean
  filterButtonTone?: FilterButtonTone
  filterButtonDisabled?: boolean
}

/**
 * フィルター状態に応じたボタンクラスを返す。
 *
 * @param tone - フィルターボタンの強調状態。
 * @returns フィルターボタンへ適用する Tailwind クラス。
 */
const getFilterButtonToneClass = (tone: FilterButtonTone): string => {
  if (tone === 'active') {
    return 'border-action-primary bg-action-primary text-text-inverse hover:bg-action-primary-hover'
  }

  if (tone === 'difficulty-only') {
    return 'border-action-primary bg-success-bg text-success hover:bg-success-bg-hover'
  }

  return 'border-border-strong text-text-muted hover:bg-surface-hover'
}

/**
 * 曲名検索欄の状態に応じた外枠クラスを返す。
 *
 * @param active - 曲名検索が既定値から変更されているか。
 * @returns 曲名検索欄の外枠へ適用する Tailwind クラス。
 */
const getTitleInputFrameClass = (active?: boolean): string =>
  active
    ? 'border-action-primary bg-success-bg focus-within:border-action-primary'
    : 'border-border-strong focus-within:border-focus-ring'

/**
 * 曲名検索欄の状態に応じたアイコンクラスを返す。
 *
 * @param active - 曲名検索が既定値から変更されているか。
 * @returns 検索アイコンへ適用する Tailwind クラス。
 */
const getTitleInputIconClass = (active?: boolean): string =>
  active ? 'text-success' : 'text-text-subtle'

/**
 * レコード一覧の検索欄とフィルター操作ボタンを表示する。
 * @param props - 検索文字列、変更ハンドラー、各操作ダイアログを開くハンドラー。
 * @returns レコード一覧上部のフィルターツールバー。
 */
const FilterToolbar: Component<FilterToolbarProps> = (props) => {
  const filterButtonTone = () =>
    props.filterButtonTone ?? (props.filterActive ? 'active' : 'default')

  /**
   * フィルター状態に応じたボタン表示名を返す。
   *
   * @returns フィルターボタンに付与するアクセシブル名。
   */
  const filterButtonLabel = () =>
    filterButtonTone() === 'default' ? 'フィルター' : 'フィルター適用中'

  return (
    <div class="flex items-center mb-2 gap-2">
      <TextField class="min-w-0 flex-1" value={props.title} onChange={props.onTitleChange}>
        <div
          class={`flex min-w-0 items-center gap-2 rounded border px-2 transition-colors ${getTitleInputFrameClass(
            props.titleActive
          )}`}
        >
          <Search
            class={`h-4 w-4 shrink-0 ${getTitleInputIconClass(props.titleActive)}`}
            aria-hidden="true"
          />
          <TextField.Input
            class="min-w-0 flex-1 bg-transparent py-2 font-sans text-sm outline-none"
            placeholder="曲名・アーティスト名で検索"
          />
        </div>
      </TextField>
      <Button
        class={`flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-strong disabled:text-disabled-text disabled:hover:bg-transparent ${getFilterButtonToneClass(
          filterButtonTone()
        )}`}
        onClick={props.onOpenFilter}
        type="button"
        aria-label={filterButtonLabel()}
        aria-pressed={filterButtonTone() !== 'default'}
        title={filterButtonLabel()}
        disabled={props.filterButtonDisabled}
      >
        <Funnel size={24} aria-hidden="true" />
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
}

export default FilterToolbar
