import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { CircleSlash2, Funnel, ListChecks, LoaderCircle } from 'lucide-solid'
import type { Accessor, JSX, Setter } from 'solid-js'
import { For, Show } from 'solid-js'
import {
  AppButton,
  type AppButtonSize,
  getAppButtonClass,
} from '../../../components/common/AppButton'
import { toMultiSelectOptions } from '../../../components/common/AppMultiSelect'
import { GenreMultiSelect, VersionMultiSelect } from '../../../components/common/DomainMultiSelect'
import { SearchTextField } from '../../../components/common/SearchTextField'
import Loading from '../../../components/Loading/Loading'
import {
  SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS,
  SONG_SELECTION_TOOLBAR_BUTTON_ACTIVE_CLASS,
  SONG_SELECTION_TOOLBAR_BUTTON_INACTIVE_CLASS,
} from './songSelectionDialog'

/** 共通楽曲選択ダイアログへ渡す表示状態と画面固有の描画処理。 */
type SongSelectionDialogBaseProps<TItem, TFilter> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  searchAriaLabel: string
  query: Accessor<string>
  setQuery: Setter<string>
  filterDialogOpen: Accessor<boolean>
  setFilterDialogOpen: Setter<boolean>
  filterChanged: Accessor<boolean>
  showSelectedOnly: Accessor<boolean>
  setShowSelectedOnly: Setter<boolean>
  selectionSummary: Accessor<string>
  announceSelectionSummary?: boolean
  items: Accessor<readonly TItem[]>
  isListReady: Accessor<boolean>
  isSaving: Accessor<boolean>
  saveError: Accessor<string | null>
  hasChanges: Accessor<boolean>
  genres: Accessor<string[]>
  versions: Accessor<string[]>
  filters: Accessor<TFilter>
  selectedGenres: (filter: TFilter) => string[]
  selectedVersions: (filter: TFilter) => string[]
  setGenres: (genres: string[]) => void
  setVersions: (versions: string[]) => void
  resetFilters: () => void
  showFilterCloseButton?: boolean
  actionButtonSize?: AppButtonSize
  renderFilterExtras?: () => JSX.Element
  renderItem: (item: TItem) => JSX.Element
  onSave: () => Promise<void>
}

const FILTER_LABEL = 'フィルター'
const FILTER_ACTIVE_LABEL = 'フィルター適用中'
const SELECTED_ONLY_LABEL = '選択済み楽曲のみ表示'
const EMPTY_MESSAGE = '該当する曲がありません'

/**
 * 楽曲選択画面で共通する全画面Dialog、検索、フィルター、一覧、保存操作を描画する。
 *
 * @param props - 共有状態、フィルター入出力、画面固有の行と追加フィルター。
 * @returns 楽曲選択ダイアログの共通UI。
 */
export const SongSelectionDialogBase = <TItem, TFilter>(
  props: SongSelectionDialogBaseProps<TItem, TFilter>
): JSX.Element => {
  const filterButtonLabel = (): string =>
    props.filterChanged() ? FILTER_ACTIVE_LABEL : FILTER_LABEL

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-4 bottom-4 z-50 flex h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:h-[90dvh] sm:max-h-[90dvh] sm:w-[92vw] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-6">
          <div class="mb-4 shrink-0">
            <Dialog.Title class="text-lg font-bold">{props.title}</Dialog.Title>
            <Dialog.Description class="mt-1 text-sm text-text-muted">
              {props.description}
            </Dialog.Description>
          </div>

          <div class="mb-3 flex min-w-0 shrink-0 items-center">
            <SearchTextField
              class="min-w-0 flex-1"
              frameClass="rounded-l"
              value={props.query()}
              active={props.query().trim().length > 0}
              onChange={props.setQuery}
              ariaLabel={props.searchAriaLabel}
              placeholder="曲名・アーティストで検索..."
            />
            <Button
              type="button"
              class={`-ml-px flex h-9.5 w-9.5 shrink-0 items-center justify-center border transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring ${
                props.filterChanged()
                  ? SONG_SELECTION_TOOLBAR_BUTTON_ACTIVE_CLASS
                  : SONG_SELECTION_TOOLBAR_BUTTON_INACTIVE_CLASS
              }`}
              aria-label={filterButtonLabel()}
              aria-pressed={props.filterChanged()}
              title={filterButtonLabel()}
              onClick={() => props.setFilterDialogOpen(true)}
            >
              <Funnel size={20} aria-hidden="true" />
            </Button>
            <Button
              type="button"
              class={`-ml-px flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-r border transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-focus-ring ${
                props.showSelectedOnly()
                  ? SONG_SELECTION_TOOLBAR_BUTTON_ACTIVE_CLASS
                  : SONG_SELECTION_TOOLBAR_BUTTON_INACTIVE_CLASS
              }`}
              aria-label={SELECTED_ONLY_LABEL}
              aria-pressed={props.showSelectedOnly()}
              title={SELECTED_ONLY_LABEL}
              onClick={() => props.setShowSelectedOnly((value) => !value)}
            >
              <ListChecks size={24} aria-hidden="true" />
            </Button>
          </div>

          <div
            class="mb-2 shrink-0 text-xs text-text-subtle"
            aria-live={props.announceSelectionSummary ? 'polite' : undefined}
          >
            {props.selectionSummary()}
          </div>

          <div class="min-h-0 flex-1 basis-0 overflow-y-auto rounded border border-border bg-surface">
            <Show
              when={props.isListReady()}
              fallback={
                <div
                  class="flex h-full min-h-32 items-center justify-center"
                  role="status"
                  aria-label="読み込み中"
                  aria-live="polite"
                  aria-busy="true"
                >
                  <Loading />
                </div>
              }
            >
              <Show
                when={props.items().length > 0}
                fallback={
                  <div class="flex h-full min-h-32 flex-col items-center justify-center gap-2 p-8 text-text-subtle">
                    <CircleSlash2 class="h-6 w-6" aria-hidden="true" />
                    <p>{EMPTY_MESSAGE}</p>
                  </div>
                }
              >
                <ul class="divide-y divide-border bg-surface">
                  <For each={props.items()}>{(item) => <li>{props.renderItem(item)}</li>}</For>
                </ul>
              </Show>
            </Show>
          </div>

          <Show when={props.saveError()}>
            {(message) => <p class="mt-3 shrink-0 text-sm text-danger">{message()}</p>}
          </Show>

          <Dialog
            open={props.filterDialogOpen()}
            onOpenChange={props.setFilterDialogOpen}
            preventScroll={false}
          >
            <Dialog.Portal>
              <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
              <Dialog.Content class="fixed inset-x-4 top-1/2 z-70 flex max-h-[80dvh] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-md sm:-translate-x-1/2 sm:p-6">
                <div class="mb-4 flex shrink-0 items-center justify-between gap-3">
                  <Dialog.Title class="text-lg font-bold">{FILTER_LABEL}</Dialog.Title>
                  <AppButton onClick={props.resetFilters}>すべて選択</AppButton>
                </div>
                <div class="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
                  <GenreMultiSelect
                    options={toMultiSelectOptions(props.genres())}
                    selected={props.selectedGenres(props.filters())}
                    labelClass="text-text"
                    contentZIndexClass={SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
                    onChange={props.setGenres}
                  />
                  <VersionMultiSelect
                    options={toMultiSelectOptions(props.versions())}
                    selected={props.selectedVersions(props.filters())}
                    labelClass="text-text"
                    contentZIndexClass={SONG_SELECTION_FILTER_SELECT_CONTENT_Z_INDEX_CLASS}
                    onChange={props.setVersions}
                  />
                  {props.renderFilterExtras?.()}
                </div>
                <div class="mt-6 flex justify-end">
                  <div class="flex gap-2">
                    <Show when={props.showFilterCloseButton}>
                      <Dialog.CloseButton class={getAppButtonClass({ variant: 'secondary' })}>
                        閉じる
                      </Dialog.CloseButton>
                    </Show>
                    <Dialog.CloseButton class={getAppButtonClass({ variant: 'primary' })}>
                      適用
                    </Dialog.CloseButton>
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog>

          <div class="mt-4 flex shrink-0 justify-end gap-2">
            <AppButton
              size={props.actionButtonSize}
              onClick={() => props.onOpenChange(false)}
              disabled={props.isSaving()}
            >
              キャンセル
            </AppButton>
            <AppButton
              variant="primary"
              size={props.actionButtonSize}
              onClick={props.onSave}
              disabled={!props.hasChanges() || props.isSaving()}
            >
              <Show when={props.isSaving()}>
                <LoaderCircle class="h-4 w-4 animate-spin" aria-hidden="true" />
              </Show>
              保存
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
