import { Button } from '@kobalte/core/button'
import { ArrowUpDown, Columns3, Funnel, Star } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { AppIconButton } from '../../../../components/common/AppButton'
import { SearchTextField } from '../../../../components/common/SearchTextField'

type FilterButtonTone = 'default' | 'active' | 'difficulty-only'

type FilterToolbarProps = {
  title: string
  onTitleChange: (value: string) => void
  onOpenFilter: () => void
  onOpenSortSettings: () => void
  onOpenColumnSettings: () => void
  onOpenFavoriteSongs?: () => void
  titleActive?: boolean
  filterActive?: boolean
  filterButtonTone?: FilterButtonTone
  filterButtonDisabled?: boolean
  favoriteSongsDisabled?: boolean
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
    return 'border-action-primary bg-action-primary-muted text-action-primary hover:bg-action-primary-muted'
  }

  return 'border-border-strong bg-surface text-text-muted hover:bg-surface-hover'
}

/**
 * レコード一覧の検索欄とフィルター操作ボタンを表示する。
 *
 * @param props - 検索文字列、変更ハンドラー、フィルター・ソート・列設定の操作状態。
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
    <div class="flex items-center mb-2">
      <SearchTextField
        class="min-w-0 flex-1"
        frameClass="rounded-l"
        value={props.title}
        onChange={props.onTitleChange}
        active={Boolean(props.titleActive)}
        ariaLabel="曲名・アーティスト名検索"
        placeholder="曲名・アーティスト名で検索"
      />
      <Button
        class={`-ml-px flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-r border transition-colors focus:outline-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:border-border-strong disabled:text-disabled-text disabled:hover:bg-transparent ${getFilterButtonToneClass(
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
      <AppIconButton
        class="ml-2 h-9.5 w-9.5"
        onClick={props.onOpenSortSettings}
        aria-label="ソート"
        title="ソート"
      >
        <ArrowUpDown size={24} aria-hidden="true" />
      </AppIconButton>
      <AppIconButton
        class="ml-2 h-9.5 w-9.5"
        onClick={props.onOpenColumnSettings}
        aria-label="列設定"
        title="列設定"
      >
        <Columns3 size={24} />
      </AppIconButton>
      <Show when={props.onOpenFavoriteSongs}>
        {(onOpenFavoriteSongs) => (
          <AppIconButton
            class="ml-2 h-9.5 w-9.5"
            onClick={onOpenFavoriteSongs()}
            aria-label="お気に入り楽曲設定"
            title="お気に入り楽曲設定"
            disabled={props.favoriteSongsDisabled}
          >
            <Star size={24} aria-hidden="true" />
          </AppIconButton>
        )}
      </Show>
    </div>
  )
}

export default FilterToolbar
